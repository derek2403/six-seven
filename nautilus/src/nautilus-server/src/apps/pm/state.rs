//! Position storage for PM
//! 
//! Stores user positions (wallet, pool, outcome, shares) in memory.

use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Position {
    pub wallet: String,
    pub pool_id: u64,
    pub outcome: u8,
    pub shares: u64,
}

pub struct PositionStore {
    // Key: (wallet, pool_id, outcome) -> shares
    positions: HashMap<(String, u64, u8), u64>,
}

impl PositionStore {
    pub fn new() -> Self {
        Self {
            positions: HashMap::new(),
        }
    }

    pub fn add_position(&mut self, wallet: String, pool_id: u64, outcome: u8, shares: u64) {
        let key = (wallet, pool_id, outcome);
        *self.positions.entry(key).or_insert(0) += shares;
    }

    pub fn get_winning_positions(&self, pool_id: u64, winning_outcome: u8) -> Vec<Position> {
        self.positions
            .iter()
            .filter(|((_, pid, out), _)| *pid == pool_id && *out == winning_outcome)
            .map(|((wallet, pid, out), shares)| Position {
                wallet: wallet.clone(),
                pool_id: *pid,
                outcome: *out,
                shares: *shares,
            })
            .collect()
    }

    pub fn clear_pool(&mut self, pool_id: u64) {
        self.positions.retain(|(_, pid, _), _| *pid != pool_id);
    }

    #[allow(dead_code)]
    pub fn get_all_positions(&self) -> Vec<Position> {
        self.positions
            .iter()
            .map(|((wallet, pool_id, outcome), shares)| Position {
                wallet: wallet.clone(),
                pool_id: *pool_id,
                outcome: *outcome,
                shares: *shares,
            })
            .collect()
    }
}

impl Default for PositionStore {
    fn default() -> Self {
        Self::new()
    }
}
