/// LMSR (Logarithmic Market Scoring Rule) implementation for Sui
/// Supports 8 outcomes with fixed-point arithmetic
module lmsr::lmsr;

use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};

// ============ Constants ============

/// Fixed-point scale (9 decimal places)
const SCALE: u64 = 1_000_000_000;

/// Number of outcomes
const N: u64 = 8;

/// Error codes
const E_INVALID_B: u64 = 1;
const E_INVALID_OUTCOME: u64 = 2;
const E_INSUFFICIENT_PAYMENT: u64 = 3;

// ============ Structs ============

/// LMSR Automated Market Maker
public struct LMSR<phantom T> has key {
    id: UID,
    b: u64,              // liquidity depth parameter
    q: vector<u64>,      // 8 outcome quantities
    reserve: Balance<T>  // token reserve
}

// ============ Fixed-Point Math Functions ============

/// Fixed-point multiplication: (a * b) / SCALE
public fun fp_mul(a: u64, b: u64): u64 {
    ((a as u128) * (b as u128) / (SCALE as u128)) as u64
}

/// Fixed-point division: (a * SCALE) / b
public fun fp_div(a: u64, b: u64): u64 {
    ((a as u128) * (SCALE as u128) / (b as u128)) as u64
}

/// Fixed-point exponential using Taylor series: e^x
/// Uses Taylor series: e^x = 1 + x + x^2/2! + x^3/3! + ...
public fun fp_exp(x: u64): u64 {
    // For very large x, cap the result to avoid overflow
    if (x > 20 * SCALE) {
        return 485165195_000_000_000; // e^20 approximately
    };
    
    let mut result: u128 = SCALE as u128;
    let mut term: u128 = SCALE as u128;
    let x128 = x as u128;
    let scale128 = SCALE as u128;
    
    // Taylor series expansion
    let mut i: u128 = 1;
    while (i <= 20) {
        term = term * x128 / (i * scale128);
        result = result + term;
        if (term < 1) break;
        i = i + 1;
    };
    
    result as u64
}

/// Fixed-point natural logarithm using Newton-Raphson iteration
/// ln(x) where x is in fixed-point format
public fun fp_ln(x: u64): u64 {
    if (x == SCALE) return 0; // ln(1) = 0
    
    // Use the identity: ln(x) = 2 * ln(sqrt(x)) to reduce range
    // And Newton-Raphson: y_new = y_old + 2 * (x - e^y) / (x + e^y)
    
    let x128 = x as u128;
    let scale128 = SCALE as u128;
    
    // Initial guess
    let mut y: u128 = 0;
    
    // Count how many times we can divide x by e to get initial estimate
    let e_val: u128 = 2_718_281_828; // e in fixed-point
    let mut temp = x128;
    
    // Get initial estimate by counting powers of e
    while (temp > e_val) {
        temp = temp * scale128 / e_val;
        y = y + scale128;
    };
    
    // Newton-Raphson iterations
    let mut i = 0;
    while (i < 10) {
        let exp_y = fp_exp(y as u64) as u128;
        if (exp_y == 0) break;
        
        // y = y + (x - exp_y) * SCALE / exp_y
        if (x128 > exp_y) {
            y = y + (x128 - exp_y) * scale128 / exp_y;
        } else {
            let diff = (exp_y - x128) * scale128 / exp_y;
            if (diff > y) {
                y = 0;
                break
            };
            y = y - diff;
        };
        i = i + 1;
    };
    
    y as u64
}

/// Calculate the LMSR cost function: C(q) = b * ln(sum(exp(q_i / b)))
public fun cost(q: &vector<u64>, b: u64): u64 {
    let mut sum_exp: u128 = 0;
    let b128 = b as u128;
    let scale128 = SCALE as u128;
    
    let mut i = 0u64;
    while (i < N) {
        let qi = *vector::borrow(q, i);
        // exp(q_i / b)
        let qi_over_b = (qi as u128) * scale128 / b128;
        let exp_val = fp_exp(qi_over_b as u64);
        sum_exp = sum_exp + (exp_val as u128);
        i = i + 1;
    };
    
    // b * ln(sum_exp)
    let ln_sum = fp_ln((sum_exp) as u64);
    fp_mul(b, ln_sum)
}

// ============ AMM Functions ============

/// Create a new LMSR AMM with given liquidity parameter b
public entry fun create_amm<T>(b: u64, ctx: &mut TxContext) {
    assert!(b > 0, E_INVALID_B);
    
    let mut q = vector::empty<u64>();
    let mut i = 0u64;
    while (i < N) {
        vector::push_back(&mut q, 0);
        i = i + 1;
    };

    let amm = LMSR<T> {
        id: object::new(ctx),
        b,
        q,
        reserve: balance::zero<T>()
    };

    transfer::share_object(amm);
}

/// Buy shares of a specific outcome
public entry fun buy<T>(
    amm: &mut LMSR<T>,
    outcome: u64,
    amount: u64,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    assert!(outcome < N, E_INVALID_OUTCOME);
    
    // Calculate cost before and after
    let cost_before = cost(&amm.q, amm.b);
    
    // Update quantity
    let qi = vector::borrow_mut(&mut amm.q, outcome);
    *qi = *qi + amount;
    
    let cost_after = cost(&amm.q, amm.b);
    
    // Price = cost_after - cost_before
    let price = cost_after - cost_before;
    
    // Ensure payment covers the price
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= price, E_INSUFFICIENT_PAYMENT);
    
    // Take the exact price and refund any excess
    if (payment_amount > price) {
        let mut payment_balance = coin::into_balance(payment);
        let refund_amount = payment_amount - price;
        let refund_balance = balance::split(&mut payment_balance, refund_amount);
        let refund_coin = coin::from_balance(refund_balance, ctx);
        transfer::public_transfer(refund_coin, tx_context::sender(ctx));
        balance::join(&mut amm.reserve, payment_balance);
    } else {
        balance::join(&mut amm.reserve, coin::into_balance(payment));
    };
}

/// Sell shares of a specific outcome
public entry fun sell<T>(
    amm: &mut LMSR<T>,
    outcome: u64,
    amount: u64,
    ctx: &mut TxContext
) {
    assert!(outcome < N, E_INVALID_OUTCOME);
    
    // Ensure user has enough shares
    let qi = vector::borrow(&amm.q, outcome);
    assert!(*qi >= amount, E_INSUFFICIENT_PAYMENT);
    
    // Calculate cost before and after
    let cost_before = cost(&amm.q, amm.b);
    
    // Update quantity
    let qi_mut = vector::borrow_mut(&mut amm.q, outcome);
    *qi_mut = *qi_mut - amount;
    
    let cost_after = cost(&amm.q, amm.b);
    
    // Payout = cost_before - cost_after
    let payout = cost_before - cost_after;
    
    // Send payout to seller
    if (payout > 0) {
        let payout_balance = balance::split(&mut amm.reserve, payout);
        let payout_coin = coin::from_balance(payout_balance, ctx);
        transfer::public_transfer(payout_coin, tx_context::sender(ctx));
    };
}

/// Get current prices for all outcomes (softmax)
public fun get_prices<T>(amm: &LMSR<T>): vector<u64> {
    let mut exps = vector::empty<u64>();
    let mut sum: u128 = 0;

    let mut i = 0u64;
    while (i < N) {
        let qi = *vector::borrow(&amm.q, i);
        let qi_over_b = fp_div(qi, amm.b);
        let e = fp_exp(qi_over_b);
        vector::push_back(&mut exps, e);
        sum = sum + (e as u128);
        i = i + 1;
    };

    let mut prices = vector::empty<u64>();
    let mut j = 0u64;
    while (j < N) {
        let exp_j = *vector::borrow(&exps, j);
        let price = ((exp_j as u128) * (SCALE as u128) / sum) as u64;
        vector::push_back(&mut prices, price);
        j = j + 1;
    };

    prices
}

/// Get the liquidity parameter b
public fun get_b<T>(amm: &LMSR<T>): u64 {
    amm.b
}

/// Get the current quantities
public fun get_quantities<T>(amm: &LMSR<T>): vector<u64> {
    amm.q
}

/// Get the reserve balance
public fun get_reserve<T>(amm: &LMSR<T>): u64 {
    balance::value(&amm.reserve)
}
