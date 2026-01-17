//! State Management for Prediction Market
//! 
//! Manages the world table, user positions, and commitments.
//! This state lives inside the TEE and is private.

use sha2::{Sha256, Digest};
use std::collections::HashMap;

/// Number of binary events in the market
pub const NUM_EVENTS: usize = 3;

/// Number of possible worlds (2^NUM_EVENTS)
pub const NUM_WORLDS: usize = 1 << NUM_EVENTS; // 8 for 3 events

/// Market state stored inside TEE
#[derive(Debug, Clone)]
pub struct MarketState {
    /// Outstanding shares for each world outcome
    pub quantities: Vec<f64>,
    
    /// LMSR liquidity parameter
    pub b: f64,
    
    /// User positions: user_address -> (world_idx -> shares)
    pub positions: HashMap<String, HashMap<usize, f64>>,
    
    /// Commitments: user_address -> list of commitment hashes
    pub commitments: HashMap<String, Vec<String>>,
    
    /// Nonce for commitment generation
    nonce_counter: u64,
}

impl MarketState {
    /// Create new market with uniform initial probabilities
    pub fn new(initial_liquidity: f64) -> Self {
        // Start with equal quantities for all worlds
        let quantities = vec![0.0; NUM_WORLDS];
        
        Self {
            quantities,
            b: initial_liquidity,
            positions: HashMap::new(),
            commitments: HashMap::new(),
            nonce_counter: 0,
        }
    }

    /// Get or create user's position map
    pub fn get_user_positions(&self, user: &str) -> HashMap<usize, f64> {
        self.positions.get(user).cloned().unwrap_or_default()
    }

    /// Add shares to user's position for specific worlds
    pub fn add_position(&mut self, user: &str, worlds: &[usize], shares: f64) {
        let user_pos = self.positions.entry(user.to_string()).or_default();
        for &world in worlds {
            *user_pos.entry(world).or_insert(0.0) += shares;
        }
    }

    /// Update quantities after a trade
    pub fn update_quantities(&mut self, new_quantities: Vec<f64>) {
        self.quantities = new_quantities;
    }

    /// Generate a commitment hash for a bet
    /// Commitment = hash(user + bet_details + nonce)
    pub fn generate_commitment(
        &mut self,
        user: &str,
        worlds: &[usize],
        shares: f64,
    ) -> String {
        self.nonce_counter += 1;
        
        let mut hasher = Sha256::new();
        hasher.update(user.as_bytes());
        hasher.update(&worlds.len().to_le_bytes());
        for &w in worlds {
            hasher.update(&w.to_le_bytes());
        }
        hasher.update(&shares.to_le_bytes());
        hasher.update(&self.nonce_counter.to_le_bytes());
        
        let result = hasher.finalize();
        let commitment = hex::encode(result);
        
        // Store commitment for later verification
        self.commitments
            .entry(user.to_string())
            .or_default()
            .push(commitment.clone());
        
        commitment
    }

    /// Get user's total shares that win if given world is the outcome
    pub fn get_winning_shares(&self, user: &str, winning_world: usize) -> f64 {
        self.positions
            .get(user)
            .and_then(|pos| pos.get(&winning_world))
            .copied()
            .unwrap_or(0.0)
    }

    /// Get all of user's positions
    pub fn get_all_positions(&self, user: &str) -> Vec<(usize, f64)> {
        self.positions
            .get(user)
            .map(|pos| pos.iter().map(|(&w, &s)| (w, s)).collect())
            .unwrap_or_default()
    }

    /// Verify a commitment exists for user
    pub fn verify_commitment(&self, user: &str, commitment: &str) -> bool {
        self.commitments
            .get(user)
            .map(|commits| commits.contains(&commitment.to_string()))
            .unwrap_or(false)
    }
}

/// Bet request from user
#[derive(Debug, Clone)]
pub struct BetRequest {
    pub user: String,
    pub bet_type: BetType,
    pub amount: f64,
}

/// Type of bet
#[derive(Debug, Clone)]
pub enum BetType {
    /// Single event bet: (event_index, is_yes)
    Marginal { event: usize, yes: bool },
    
    /// Multiple events specified, some ignored: Vec<(event_index, is_yes)>
    Slice { conditions: Vec<(usize, bool)> },
    
    /// Exact world bet
    Corner { world: usize },
}

impl BetType {
    /// Get the world indices this bet covers
    pub fn get_worlds(&self) -> Vec<usize> {
        use super::lmsr::{marginal_worlds, slice_worlds};
        
        match self {
            BetType::Marginal { event, yes } => {
                marginal_worlds(*event, *yes, NUM_EVENTS)
            }
            BetType::Slice { conditions } => {
                slice_worlds(conditions, NUM_EVENTS)
            }
            BetType::Corner { world } => {
                vec![*world]
            }
        }
    }
}

/// Result of placing a bet
#[derive(Debug, Clone)]
pub struct BetResult {
    pub shares: f64,
    pub new_prices: Vec<f64>,
    pub commitment: String,
    pub worlds: Vec<usize>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_market() {
        let state = MarketState::new(100.0);
        assert_eq!(state.quantities.len(), 8);
        assert_eq!(state.b, 100.0);
    }

    #[test]
    fn test_add_position() {
        let mut state = MarketState::new(100.0);
        state.add_position("user1", &[6, 7], 10.0);
        
        let pos = state.get_user_positions("user1");
        assert_eq!(pos.get(&6), Some(&10.0));
        assert_eq!(pos.get(&7), Some(&10.0));
    }

    #[test]
    fn test_bet_type_worlds() {
        // A=Yes should be worlds 4,5,6,7
        let bet = BetType::Marginal { event: 0, yes: true };
        assert_eq!(bet.get_worlds(), vec![4, 5, 6, 7]);
        
        // Corner world 6 (110)
        let bet = BetType::Corner { world: 6 };
        assert_eq!(bet.get_worlds(), vec![6]);
    }
}
