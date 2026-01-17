//! Prediction Market Nautilus App (Federated Architecture)
//! 
//! TEE executes contract calls directly using its own keys.
//! Endpoints:
//! - POST /process_data - Place a bet (executes Vault + World updates)
//! - POST /resolve - Resolve market and pay winners

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
use state::PositionStore;

// ============================================================
// GLOBAL POSITION STORE (persists across requests in TEE)
// ============================================================
static POSITION_STORE: Lazy<RwLock<PositionStore>> = Lazy::new(|| {
    RwLock::new(PositionStore::new())
});

// LMSR liquidity parameter
const LMSR_B: f64 = 100.0;

// ============================================================
// INTENT SCOPES - must match Move contract
// ============================================================
#[derive(Serialize_repr, Deserialize_repr, Debug, Clone, Copy)]
#[repr(u8)]
pub enum IntentScope {
    PlaceBet = 0,
    Resolve = 1,
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

/// Request to place a bet
#[derive(Debug, Serialize, Deserialize)]
pub struct PlaceBetRequest {
    pub user: String,              // Bettor's wallet address
    pub pool_id: u64,              // Which pool to bet on
    pub outcome: u8,               // Which world (0-7) to bet on
    pub amount: u64,               // Amount in smallest units (scaled by 10^6)
    pub maker: String,             // Pool creator's wallet (receives funds)
    pub current_probs: Vec<u64>,   // Current probabilities from World (scaled by 10000)
}

/// Response after placing a bet
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaceBetResponse {
    pub success: bool,
    pub shares: u64,               // Shares bought (scaled by 1000)
    pub new_probs: Vec<u64>,       // New probabilities (scaled by 10000 for World)
    
    // Vault operations to execute
    pub debit_user: String,
    pub debit_amount: u64,
    pub credit_maker: String,
    pub credit_amount: u64,
    
    // World operation to execute
    pub world_pool_id: u64,
}

/// Request to resolve a market
#[derive(Debug, Serialize, Deserialize)]
pub struct ResolveRequest {
    pub pool_id: u64,
    pub winning_outcome: u8,
}

/// Payout info for a winner
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payout {
    pub user: String,
    pub amount: u64,
}

/// Response after resolving
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResolveResponse {
    pub success: bool,
    pub pool_id: u64,
    pub winning_outcome: u8,
    pub payouts: Vec<Payout>,
    pub total_payout: u64,
}

// ============================================================
// MAIN ENDPOINT: process_data (Place Bet)
// ============================================================
pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<PlaceBetRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<PlaceBetResponse>>>, EnclaveError> {
    let req = &request.payload;
    
    // Convert current probs to f64 for LMSR
    let current_quantities: Vec<f64> = req.current_probs
        .iter()
        .map(|&p| {
            // Convert probability to quantity using inverse LMSR
            // q_i = b * ln(p_i) + constant (we use 0 as base)
            let prob = (p as f64) / 10000.0;
            if prob > 0.0 {
                LMSR_B * prob.ln()
            } else {
                0.0
            }
        })
        .collect();
    
    // Calculate shares using LMSR
    let lmsr = LMSR::new(LMSR_B);
    let outcomes = vec![req.outcome as usize];
    let amount_f64 = (req.amount as f64) / 1_000_000.0; // Convert from scaled to float
    
    let (shares_f64, new_quantities) = lmsr.shares_for_amount(&current_quantities, &outcomes, amount_f64);
    let new_prices = lmsr.prices(&new_quantities);
    
    // Store position
    {
        let mut store = POSITION_STORE.write()
            .map_err(|_| EnclaveError::GenericError("Lock error".into()))?;
        store.add_position(
            req.user.clone(),
            req.pool_id,
            req.outcome,
            (shares_f64 * 1000.0) as u64,
        );
    }
    
    // Build response
    let response = PlaceBetResponse {
        success: true,
        shares: (shares_f64 * 1000.0) as u64,
        new_probs: new_prices.iter().map(|&p| (p * 10000.0) as u64).collect(),
        debit_user: req.user.clone(),
        debit_amount: req.amount,
        credit_maker: req.maker.clone(),
        credit_amount: req.amount,
        world_pool_id: req.pool_id,
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
// RESOLVE ENDPOINT
// ============================================================
pub async fn resolve(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<ResolveRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<ResolveResponse>>>, EnclaveError> {
    let req = &request.payload;
    
    let payouts: Vec<Payout>;
    let total_payout: u64;
    
    {
        let mut store = POSITION_STORE.write()
            .map_err(|_| EnclaveError::GenericError("Lock error".into()))?;
        
        // Get winning positions
        let winners = store.get_winning_positions(req.pool_id, req.winning_outcome);
        
        // Calculate payouts (shares / 1000 = payout in USDC units)
        // In reality, payout = shares * (1 / winning_prob), but simplified here
        payouts = winners
            .iter()
            .map(|p| Payout {
                user: p.wallet.clone(),
                amount: p.shares * 1000, // Each share worth 1 USDC at resolution
            })
            .collect();
        
        total_payout = payouts.iter().map(|p| p.amount).sum();
        
        // Clear positions for this pool
        store.clear_positions_for_pool(req.pool_id);
    }
    
    let response = ResolveResponse {
        success: true,
        pool_id: req.pool_id,
        winning_outcome: req.winning_outcome,
        payouts,
        total_payout,
    };
    
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| EnclaveError::GenericError(format!("Time error: {e}")))?
        .as_millis() as u64;
    
    Ok(Json(to_signed_response(
        &state.eph_kp,
        response,
        timestamp_ms,
        IntentScope::Resolve as u8,
    )))
}

// ============================================================
// HELPER: Get current state (for debugging)
// ============================================================
pub fn get_positions_for_pool(pool_id: u64) -> Result<Vec<state::Position>, EnclaveError> {
    let store = POSITION_STORE.read()
        .map_err(|_| EnclaveError::GenericError("Lock error".into()))?;
    Ok(store.get_positions_by_pool(pool_id).into_iter().cloned().collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lmsr_shares_calculation() {
        let lmsr = LMSR::new(100.0);
        let quantities = vec![0.0; 8];
        let outcomes = vec![3]; // Bet on outcome 3
        let amount = 10.0;
        
        let (shares, new_quantities) = lmsr.shares_for_amount(&quantities, &outcomes, amount);
        
        assert!(shares > 0.0);
        assert!(new_quantities[3] > 0.0);
    }
}
