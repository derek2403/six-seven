//! Prediction Market Nautilus App
//! 
//! Endpoints:
//! - POST /process_data - Place a bet (private)
//! - GET /get_prices - Get current world prices (can be public)
//! - POST /get_position - Get user's position (private, user-specific)
//! - POST /claim_proof - Generate claim proof for settlement

pub mod lmsr;
pub mod state;

use crate::common::{to_signed_response, IntentMessage, ProcessDataRequest, ProcessedDataResponse};
use crate::{AppState, EnclaveError};
use axum::{extract::State, Json};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::sync::{Arc, RwLock};

use lmsr::LMSR;
use state::{BetResult, BetType, MarketState};

// ============================================================
// GLOBAL MARKET STATE (persists across requests in TEE)
// ============================================================
static MARKET_STATE: Lazy<RwLock<MarketState>> = Lazy::new(|| {
    // Initialize with b=100 (liquidity parameter)
    RwLock::new(MarketState::new(100.0))
});

// ============================================================
// INTENT SCOPES - must match Move contract
// ============================================================
#[derive(Serialize_repr, Deserialize_repr, Debug, Clone, Copy)]
#[repr(u8)]
pub enum IntentScope {
    PlaceBet = 0,
    ClaimProof = 1,
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

/// Request to place a bet
#[derive(Debug, Serialize, Deserialize)]
pub struct PlaceBetRequest {
    pub user: String,
    pub bet_type: String,  // "marginal", "slice", "corner"
    pub event: Option<usize>,       // For marginal: which event (0=A, 1=B, 2=C)
    pub yes: Option<bool>,          // For marginal: betting yes or no
    pub conditions: Option<Vec<(usize, bool)>>,  // For slice
    pub world: Option<usize>,       // For corner
    pub amount: f64,
}

/// Response after placing a bet
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaceBetResponse {
    pub shares: u64,           // Shares bought (scaled by 1000 for precision)
    pub new_prices: Vec<u64>,  // New prices (scaled by 1_000_000 for precision)
    pub commitment: String,    // Commitment hash for on-chain
    pub worlds: Vec<u8>,       // World indices this bet covers
}

/// Request to get user position
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPositionRequest {
    pub user: String,
}

/// Response with user position
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PositionResponse {
    pub user: String,
    pub positions: Vec<(u8, u64)>,  // (world_idx, shares * 1000)
}

/// Request to generate claim proof
#[derive(Debug, Serialize, Deserialize)]
pub struct ClaimProofRequest {
    pub user: String,
    pub winning_world: usize,
}

/// Response with claim proof
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClaimProofResponse {
    pub user: String,
    pub winning_world: u8,
    pub shares: u64,        // Shares that win (scaled by 1000)
    pub payout: u64,        // Payout amount in smallest unit
    pub commitment: String, // For verification
}

// ============================================================
// MAIN ENDPOINT: process_data (Place Bet)
// ============================================================
pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<PlaceBetRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<PlaceBetResponse>>>, EnclaveError> {
    let req = &request.payload;
    
    // Parse bet type
    let bet_type = match req.bet_type.as_str() {
        "marginal" => BetType::Marginal {
            event: req.event.ok_or_else(|| EnclaveError::GenericError("Missing event".into()))?,
            yes: req.yes.ok_or_else(|| EnclaveError::GenericError("Missing yes/no".into()))?,
        },
        "slice" => BetType::Slice {
            conditions: req.conditions.clone().ok_or_else(|| EnclaveError::GenericError("Missing conditions".into()))?,
        },
        "corner" => BetType::Corner {
            world: req.world.ok_or_else(|| EnclaveError::GenericError("Missing world".into()))?,
        },
        _ => return Err(EnclaveError::GenericError("Invalid bet_type".into())),
    };
    
    // Get worlds this bet covers
    let worlds = bet_type.get_worlds();
    
    // Execute trade
    let bet_result = {
        let mut market = MARKET_STATE.write().map_err(|_| EnclaveError::GenericError("Lock error".into()))?;
        
        let lmsr = LMSR::new(market.b);
        
        // Calculate shares for amount
        let (shares, new_quantities) = lmsr.shares_for_amount(&market.quantities, &worlds, req.amount);
        
        // Update state
        market.update_quantities(new_quantities.clone());
        market.add_position(&req.user, &worlds, shares);
        
        // Generate commitment
        let commitment = market.generate_commitment(&req.user, &worlds, shares);
        
        // Get new prices
        let new_prices = lmsr.prices(&new_quantities);
        
        BetResult {
            shares,
            new_prices,
            commitment,
            worlds: worlds.clone(),
        }
    };
    
    // Create response (scale for integer precision)
    let response = PlaceBetResponse {
        shares: (bet_result.shares * 1000.0) as u64,
        new_prices: bet_result.new_prices.iter().map(|&p| (p * 1_000_000.0) as u64).collect(),
        commitment: bet_result.commitment,
        worlds: bet_result.worlds.iter().map(|&w| w as u8).collect(),
    };
    
    // Get timestamp
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| EnclaveError::GenericError(format!("Time error: {e}")))?
        .as_millis() as u64;
    
    // Return signed response
    Ok(Json(to_signed_response(
        &state.eph_kp,
        response,
        timestamp_ms,
        IntentScope::PlaceBet as u8,
    )))
}

// ============================================================
// HELPER: Get current prices (called from health_check or separate endpoint)
// ============================================================
pub fn get_current_prices() -> Result<Vec<f64>, EnclaveError> {
    let market = MARKET_STATE.read().map_err(|_| EnclaveError::GenericError("Lock error".into()))?;
    let lmsr = LMSR::new(market.b);
    Ok(lmsr.prices(&market.quantities))
}

// ============================================================
// HELPER: Get marginal probabilities (A, B, C yes probabilities)
// ============================================================
pub fn get_marginal_probabilities() -> Result<Vec<f64>, EnclaveError> {
    let prices = get_current_prices()?;
    
    let mut marginals = vec![0.0; 3];
    
    // P(A=Yes) = sum of worlds where A=1 (worlds 4,5,6,7)
    marginals[0] = prices[4] + prices[5] + prices[6] + prices[7];
    
    // P(B=Yes) = sum of worlds where B=1 (worlds 2,3,6,7)
    marginals[1] = prices[2] + prices[3] + prices[6] + prices[7];
    
    // P(C=Yes) = sum of worlds where C=1 (worlds 1,3,5,7)
    marginals[2] = prices[1] + prices[3] + prices[5] + prices[7];
    
    Ok(marginals)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_prices() {
        // Reset state for test
        let mut market = MARKET_STATE.write().unwrap();
        *market = MarketState::new(100.0);
        drop(market);
        
        let prices = get_current_prices().unwrap();
        assert_eq!(prices.len(), 8);
        
        // All prices should be equal initially (uniform)
        let first = prices[0];
        for p in &prices {
            assert!((p - first).abs() < 0.001);
        }
        
        // Sum should be 1
        let sum: f64 = prices.iter().sum();
        assert!((sum - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_marginal_probabilities() {
        let mut market = MARKET_STATE.write().unwrap();
        *market = MarketState::new(100.0);
        drop(market);
        
        let marginals = get_marginal_probabilities().unwrap();
        
        // With uniform prior, each marginal should be 0.5
        for m in &marginals {
            assert!((m - 0.5).abs() < 0.001);
        }
    }
}
