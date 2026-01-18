//! LMSR (Logarithmic Market Scoring Rule) Implementation
//! 
//! This module implements the cost function and pricing for a multi-outcome
//! prediction market using Hanson's LMSR.

/// LMSR parameters and calculations
pub struct LMSR {
    /// Liquidity parameter - higher b = more liquidity, less price impact
    pub b: f64,
}

impl LMSR {
    pub fn new(b: f64) -> Self {
        Self { b }
    }

    /// Cost function: C(q) = b * ln(sum(exp(q_i / b)))
    /// q is the vector of outstanding shares for each outcome
    pub fn cost(&self, quantities: &[f64]) -> f64 {
        let sum_exp: f64 = quantities
            .iter()
            .map(|&q| (q / self.b).exp())
            .sum();
        self.b * sum_exp.ln()
    }

    /// Price for outcome i: p_i = exp(q_i / b) / sum(exp(q_j / b))
    /// Returns probability/price for each outcome (sums to 1)
    pub fn prices(&self, quantities: &[f64]) -> Vec<f64> {
        let exp_values: Vec<f64> = quantities
            .iter()
            .map(|&q| (q / self.b).exp())
            .collect();
        let sum_exp: f64 = exp_values.iter().sum();
        exp_values.iter().map(|&e| e / sum_exp).collect()
    }

    /// Calculate cost to buy `delta` shares of outcome `outcome_idx`
    /// Returns (cost, new_quantities)
    pub fn buy_cost(
        &self,
        quantities: &[f64],
        outcome_idx: usize,
        delta: f64,
    ) -> (f64, Vec<f64>) {
        let old_cost = self.cost(quantities);
        
        let mut new_quantities = quantities.to_vec();
        new_quantities[outcome_idx] += delta;
        
        let new_cost = self.cost(&new_quantities);
        let cost = new_cost - old_cost;
        
        (cost, new_quantities)
    }

    /// Calculate cost to buy shares across multiple outcomes (for slices/marginals)
    /// outcomes: indices of worlds to buy
    /// delta: shares to add to EACH outcome in the set
    pub fn buy_basket_cost(
        &self,
        quantities: &[f64],
        outcomes: &[usize],
        delta: f64,
    ) -> (f64, Vec<f64>) {
        let old_cost = self.cost(quantities);
        
        let mut new_quantities = quantities.to_vec();
        for &idx in outcomes {
            new_quantities[idx] += delta;
        }
        
        let new_cost = self.cost(&new_quantities);
        let cost = new_cost - old_cost;
        
        (cost, new_quantities)
    }

    /// Given an amount to spend, calculate how many shares user gets
    /// Uses binary search to find the right number of shares
    pub fn shares_for_amount(
        &self,
        quantities: &[f64],
        outcomes: &[usize],
        amount: f64,
    ) -> (f64, Vec<f64>) {
        let mut low = 0.0;
        let mut high = amount * 100.0; // Upper bound guess
        
        // Binary search for correct number of shares
        for _ in 0..50 {
            let mid = (low + high) / 2.0;
            let (cost, _) = self.buy_basket_cost(quantities, outcomes, mid);
            
            if cost < amount {
                low = mid;
            } else {
                high = mid;
            }
        }
        
        let shares = (low + high) / 2.0;
        let (_, new_quantities) = self.buy_basket_cost(quantities, outcomes, shares);
        (shares, new_quantities)
    }
}

/// Get world indices for a marginal bet (single event)
/// event_idx: 0=A, 1=B, 2=C
/// value: true=Yes, false=No
/// num_events: total number of events (e.g., 3)
pub fn marginal_worlds(event_idx: usize, value: bool, num_events: usize) -> Vec<usize> {
    let num_worlds = 1 << num_events; // 2^num_events
    let mut worlds = Vec::new();
    
    for world in 0..num_worlds {
        let event_value = (world >> (num_events - 1 - event_idx)) & 1 == 1;
        if event_value == value {
            worlds.push(world);
        }
    }
    
    worlds
}

/// Get world indices for a slice bet (multiple events specified, some ignored)
/// conditions: Vec of (event_idx, value) pairs
/// num_events: total number of events
pub fn slice_worlds(conditions: &[(usize, bool)], num_events: usize) -> Vec<usize> {
    let num_worlds = 1 << num_events;
    let mut worlds = Vec::new();
    
    for world in 0..num_worlds {
        let mut matches = true;
        for &(event_idx, value) in conditions {
            let event_value = (world >> (num_events - 1 - event_idx)) & 1 == 1;
            if event_value != value {
                matches = false;
                break;
            }
        }
        if matches {
            worlds.push(world);
        }
    }
    
    worlds
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prices_sum_to_one() {
        let lmsr = LMSR::new(100.0);
        let quantities = vec![0.0; 8]; // 8 outcomes for 3 events
        let prices = lmsr.prices(&quantities);
        let sum: f64 = prices.iter().sum();
        assert!((sum - 1.0).abs() < 0.0001);
    }

    #[test]
    fn test_marginal_worlds() {
        // For 3 events, A=Yes should be worlds {4,5,6,7} (100,101,110,111 in binary)
        let worlds = marginal_worlds(0, true, 3);
        assert_eq!(worlds, vec![4, 5, 6, 7]);
        
        // A=No should be worlds {0,1,2,3}
        let worlds = marginal_worlds(0, false, 3);
        assert_eq!(worlds, vec![0, 1, 2, 3]);
    }

    #[test]
    fn test_slice_worlds() {
        // A=Yes AND B=Yes should be worlds {6,7} (110, 111)
        let worlds = slice_worlds(&[(0, true), (1, true)], 3);
        assert_eq!(worlds, vec![6, 7]);
    }

    #[test]
    fn test_repro_bet_1_usdc() {
        let lmsr = LMSR::new(100.0);
        let quantities = vec![0.0; 8];
        let outcomes = vec![0, 1, 4, 5]; // Event B = No
        let amount = 1.0;
        
        let (shares, new_quantities) = lmsr.shares_for_amount(&quantities, &outcomes, amount);
        println!("Shares: {}", shares);
        println!("New Quantities: {:?}", new_quantities);
        
        // Calculate prices
        let prices = lmsr.prices(&new_quantities);
        println!("Prices: {:?}", prices);
        
        assert!(shares > 0.0);
        assert!(shares < 100.0); // Should be reasonable
        
        // Check prices sum to 1
        let sum: f64 = prices.iter().sum();
        assert!((sum - 1.0).abs() < 0.0001);
        
        // Price for B=No should increase (indices 0,1,4,5)
        // Initial price of B=No is 0.5.
        // New price should be > 0.5.
        // P(B=No) = p0+p1+p4+p5
        let prob_no = prices[0] + prices[1] + prices[4] + prices[5];
        println!("Prob B=No: {}", prob_no);
        assert!(prob_no > 0.5);
    }
}
