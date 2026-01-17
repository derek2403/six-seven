#[test_only]
module lmsr::lmsr_tests;

use lmsr::lmsr::{Self, fp_mul, fp_div, fp_exp, fp_ln, cost};

const SCALE: u64 = 1_000_000_000;

// ============ Fixed-Point Math Tests ============

#[test]
fun test_fp_mul() {
    // 2.0 * 3.0 = 6.0
    let a = 2 * SCALE;
    let b = 3 * SCALE;
    let result = fp_mul(a, b);
    assert!(result == 6 * SCALE);
    
    // 0.5 * 0.5 = 0.25
    let c = SCALE / 2;
    let d = SCALE / 2;
    let result2 = fp_mul(c, d);
    assert!(result2 == SCALE / 4);
}

#[test]
fun test_fp_div() {
    // 6.0 / 3.0 = 2.0
    let a = 6 * SCALE;
    let b = 3 * SCALE;
    let result = fp_div(a, b);
    assert!(result == 2 * SCALE);
    
    // 1.0 / 2.0 = 0.5
    let c = SCALE;
    let d = 2 * SCALE;
    let result2 = fp_div(c, d);
    assert!(result2 == SCALE / 2);
}

#[test]
fun test_fp_exp_zero() {
    // e^0 = 1
    let result = fp_exp(0);
    assert!(result == SCALE);
}

#[test]
fun test_fp_exp_one() {
    // e^1 ≈ 2.718
    let result = fp_exp(SCALE);
    // Allow 5% error
    let expected = 2_718_281_828u64;
    let diff = if (result > expected) { result - expected } else { expected - result };
    assert!(diff < expected / 20); // 5% tolerance
}

#[test]
fun test_fp_exp_two() {
    // e^2 ≈ 7.389
    let result = fp_exp(2 * SCALE);
    let expected = 7_389_056_099u64;
    let diff = if (result > expected) { result - expected } else { expected - result };
    assert!(diff < expected / 10); // 10% tolerance for larger values
}

#[test]
fun test_fp_ln_one() {
    // ln(1) = 0
    let result = fp_ln(SCALE);
    assert!(result == 0);
}

#[test]
fun test_fp_ln_e() {
    // ln(e) = 1
    let e_val = 2_718_281_828u64;
    let result = fp_ln(e_val);
    // Allow 5% error
    let diff = if (result > SCALE) { result - SCALE } else { SCALE - result };
    assert!(diff < SCALE / 20);
}

#[test]
fun test_fp_ln_two() {
    // ln(2) ≈ 0.693
    let result = fp_ln(2 * SCALE);
    let expected = 693_147_180u64;
    let diff = if (result > expected) { result - expected } else { expected - result };
    assert!(diff < expected / 10); // 10% tolerance
}

// ============ Cost Function Tests ============

#[test]
fun test_cost_uniform() {
    // With all q_i = 0, cost should be b * ln(8) since sum(exp(0)) = 8
    let b = SCALE; // b = 1.0
    let q = vector[0u64, 0, 0, 0, 0, 0, 0, 0];
    
    let c = cost(&q, b);
    
    // ln(8) = 3 * ln(2) ≈ 2.079
    let expected = 2_079_441_540u64;
    let diff = if (c > expected) { c - expected } else { expected - c };
    assert!(diff < expected / 5); // 20% tolerance
}

#[test]
fun test_cost_increases_with_buy() {
    let b = SCALE;
    let q_old = vector[0u64, 0, 0, 0, 0, 0, 0, 0];
    let q_new = vector[SCALE, 0, 0, 0, 0, 0, 0, 0]; // Buy 1 unit of outcome 0
    
    let cost_old = cost(&q_old, b);
    let cost_new = cost(&q_new, b);
    
    assert!(cost_new > cost_old);
}

// ============ Price Tests ============

#[test]
fun test_prices_sum_to_scale() {
    use sui::test_scenario;
    
    let admin = @0x1;
    let mut scenario = test_scenario::begin(admin);
    
    // Create AMM
    {
        lmsr::create_amm<sui::sui::SUI>(SCALE, scenario.ctx());
    };
    
    // Check prices sum to approximately SCALE
    scenario.next_tx(admin);
    {
        let amm = scenario.take_shared<lmsr::LMSR<sui::sui::SUI>>();
        let prices = lmsr::get_prices(&amm);
        
        let mut sum = 0u64;
        let mut i = 0u64;
        while (i < 8) {
            sum = sum + *vector::borrow(&prices, i);
            i = i + 1;
        };
        
        // Allow 1% error due to fixed-point rounding
        let diff = if (sum > SCALE) { sum - SCALE } else { SCALE - sum };
        assert!(diff < SCALE / 100);
        
        test_scenario::return_shared(amm);
    };
    
    scenario.end();
}

#[test]
fun test_uniform_prices() {
    use sui::test_scenario;
    
    let admin = @0x1;
    let mut scenario = test_scenario::begin(admin);
    
    // Create AMM with all q = 0
    {
        lmsr::create_amm<sui::sui::SUI>(SCALE, scenario.ctx());
    };
    
    scenario.next_tx(admin);
    {
        let amm = scenario.take_shared<lmsr::LMSR<sui::sui::SUI>>();
        let prices = lmsr::get_prices(&amm);
        
        // With all q = 0, all prices should be equal (1/8)
        let expected_price = SCALE / 8; // 125_000_000
        
        let mut i = 0u64;
        while (i < 8) {
            let price = *vector::borrow(&prices, i);
            let diff = if (price > expected_price) { price - expected_price } else { expected_price - price };
            // Allow 5% error
            assert!(diff < expected_price / 20);
            i = i + 1;
        };
        
        test_scenario::return_shared(amm);
    };
    
    scenario.end();
}

// ============ AMM Creation Test ============

#[test]
fun test_create_amm() {
    use sui::test_scenario;
    
    let admin = @0x1;
    let mut scenario = test_scenario::begin(admin);
    
    {
        lmsr::create_amm<sui::sui::SUI>(SCALE, scenario.ctx());
    };
    
    scenario.next_tx(admin);
    {
        let amm = scenario.take_shared<lmsr::LMSR<sui::sui::SUI>>();
        
        assert!(lmsr::get_b(&amm) == SCALE);
        
        let q = lmsr::get_quantities(&amm);
        assert!(vector::length(&q) == 8);
        
        let mut i = 0u64;
        while (i < 8) {
            assert!(*vector::borrow(&q, i) == 0);
            i = i + 1;
        };
        
        test_scenario::return_shared(amm);
    };
    
    scenario.end();
}

#[test]
#[expected_failure]
fun test_create_amm_invalid_b() {
    use sui::test_scenario;
    
    let admin = @0x1;
    let mut scenario = test_scenario::begin(admin);
    
    {
        // b = 0 should fail
        lmsr::create_amm<sui::sui::SUI>(0, scenario.ctx());
    };
    
    scenario.end();
}
