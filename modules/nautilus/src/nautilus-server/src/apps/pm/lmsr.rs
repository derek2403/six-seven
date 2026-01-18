//! LMSR (Logarithmic Market Scoring Rule) Implementation
//! 
//! Implements cost-based LMSR pricing for prediction markets.

use std::f64::consts::E;

pub struct LMSR {
    b: f64, // Liquidity parameter
}

impl LMSR {
    pub fn new(b: f64) -> Self {
        Self { b }
    }

    /// Calculate the cost function C(q) = b * ln(sum(e^(q_i/b)))
    pub fn cost(&self, quantities: &[f64]) -> f64 {
        let sum_exp: f64 = quantities.iter()
            .map(|&q| E.powf(q / self.b))
            .sum();
        self.b * sum_exp.ln()
    }

    /// Calculate prices (probabilities) for each outcome
    /// p_i = e^(q_i/b) / sum(e^(q_j/b))
    pub fn prices(&self, quantities: &[f64]) -> Vec<f64> {
        let exps: Vec<f64> = quantities.iter()
            .map(|&q| E.powf(q / self.b))
            .collect();
        let sum_exp: f64 = exps.iter().sum();
        exps.iter().map(|&e| e / sum_exp).collect()
    }

    /// Calculate shares bought for a given amount spent on specific outcomes
    /// Returns (shares_bought, new_quantities)
    pub fn shares_for_amount(
        &self,
        current_quantities: &[f64],
        outcomes: &[usize],
        amount: f64,
    ) -> (f64, Vec<f64>) {
        // Binary search for shares
        let mut low = 0.0;
        let mut high = amount * 10.0; // Upper bound guess
        let mut shares = 0.0;
        
        for _ in 0..100 { // Max iterations
            let mid = (low + high) / 2.0;
            let mut new_quantities = current_quantities.to_vec();
            
            for &outcome in outcomes {
                if outcome < new_quantities.len() {
                    new_quantities[outcome] += mid;
                }
            }
            
            let cost_diff = self.cost(&new_quantities) - self.cost(current_quantities);
            
            if (cost_diff - amount).abs() < 0.0001 {
                shares = mid;
                break;
            } else if cost_diff < amount {
                low = mid;
            } else {
                high = mid;
            }
            shares = mid;
        }
        
        let mut new_quantities = current_quantities.to_vec();
        for &outcome in outcomes {
            if outcome < new_quantities.len() {
                new_quantities[outcome] += shares;
            }
        }
        
        (shares, new_quantities)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_prices() {
        let lmsr = LMSR::new(100.0);
        let quantities = vec![0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        let prices = lmsr.prices(&quantities);
        
        // All prices should be equal (1/8 = 0.125)
        for p in &prices {
            assert!((p - 0.125).abs() < 0.001);
        }
    }

    #[test]
    fn test_buy_shares() {
        let lmsr = LMSR::new(100.0);
        let quantities = vec![0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        
        let (shares, new_q) = lmsr.shares_for_amount(&quantities, &[0], 1.0);
        
        assert!(shares > 0.0);
        assert!(new_q[0] > quantities[0]);
        
        let new_prices = lmsr.prices(&new_q);
        assert!(new_prices[0] > 0.125); // Price of outcome 0 should increase
    }
}
