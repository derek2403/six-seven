//! State Management for Prediction Market
//! 
//! Stores user positions. Simple and minimal.
//! Positions: (wallet, pool_id, outcome, shares)

use std::collections::HashMap;

/// A single user position
#[derive(Debug, Clone)]
pub struct Position {
    pub wallet: String,
    pub pool_id: u64,
    pub outcome: u8,    // Which world (0-7)
    pub shares: u64,    // Scaled by 1000
}

/// Position store - holds all positions in the TEE
#[derive(Debug, Default)]
pub struct PositionStore {
    /// All positions, keyed by (wallet, pool_id) for fast lookup
    positions: HashMap<(String, u64), Vec<Position>>,
}

impl PositionStore {
    pub fn new() -> Self {
        Self {
            positions: HashMap::new(),
        }
    }

    /// Add a position for a user
    pub fn add_position(&mut self, wallet: String, pool_id: u64, outcome: u8, shares: u64) {
        let key = (wallet.clone(), pool_id);
        let position = Position {
            wallet,
            pool_id,
            outcome,
            shares,
        };
        self.positions.entry(key).or_default().push(position);
    }

    /// Get all positions for a specific pool
    pub fn get_positions_by_pool(&self, pool_id: u64) -> Vec<&Position> {
        self.positions
            .values()
            .flatten()
            .filter(|p| p.pool_id == pool_id)
            .collect()
    }

    /// Get positions for a specific user in a pool
    pub fn get_user_positions(&self, wallet: &str, pool_id: u64) -> Vec<&Position> {
        self.positions
            .get(&(wallet.to_string(), pool_id))
            .map(|v| v.iter().collect())
            .unwrap_or_default()
    }

    /// Get winning positions for a pool (positions with matching outcome)
    pub fn get_winning_positions(&self, pool_id: u64, winning_outcome: u8) -> Vec<&Position> {
        self.get_positions_by_pool(pool_id)
            .into_iter()
            .filter(|p| p.outcome == winning_outcome)
            .collect()
    }

    /// Clear all positions for a pool (after resolution)
    pub fn clear_positions_for_pool(&mut self, pool_id: u64) {
        self.positions.retain(|(_, pid), _| *pid != pool_id);
    }

    /// Get total shares for a user's winning outcome in a pool
    pub fn get_user_winning_shares(&self, wallet: &str, pool_id: u64, winning_outcome: u8) -> u64 {
        self.get_user_positions(wallet, pool_id)
            .iter()
            .filter(|p| p.outcome == winning_outcome)
            .map(|p| p.shares)
            .sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_and_get_positions() {
        let mut store = PositionStore::new();
        
        store.add_position("0xuser1".to_string(), 1, 3, 1000);
        store.add_position("0xuser1".to_string(), 1, 5, 500);
        store.add_position("0xuser2".to_string(), 1, 3, 2000);
        
        let pool_positions = store.get_positions_by_pool(1);
        assert_eq!(pool_positions.len(), 3);
        
        let user1_positions = store.get_user_positions("0xuser1", 1);
        assert_eq!(user1_positions.len(), 2);
    }

    #[test]
    fn test_winning_positions() {
        let mut store = PositionStore::new();
        
        store.add_position("0xuser1".to_string(), 1, 3, 1000);
        store.add_position("0xuser2".to_string(), 1, 5, 500);
        store.add_position("0xuser3".to_string(), 1, 3, 2000);
        
        let winners = store.get_winning_positions(1, 3);
        assert_eq!(winners.len(), 2);
        
        let user1_shares = store.get_user_winning_shares("0xuser1", 1, 3);
        assert_eq!(user1_shares, 1000);
    }

    #[test]
    fn test_clear_positions() {
        let mut store = PositionStore::new();
        
        store.add_position("0xuser1".to_string(), 1, 3, 1000);
        store.add_position("0xuser1".to_string(), 2, 5, 500);
        
        store.clear_positions_for_pool(1);
        
        assert_eq!(store.get_positions_by_pool(1).len(), 0);
        assert_eq!(store.get_positions_by_pool(2).len(), 1);
    }
}
