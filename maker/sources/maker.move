/// Prediction Market Pool for Sui
/// Supports 8 world outcomes (000-111) with fixed probabilities
module maker::maker;

use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};

// ============ Constants ============


/// Number of outcomes (8 worlds for 3 binary events)
const N: u64 = 8;

/// Initial probability for each outcome: 12.5% = 0.125 = 125_000_000 in fixed-point
const INITIAL_PROBABILITY: u64 = 125_000_000;

/// Error codes
const E_INVALID_AMOUNT: u64 = 1;
const E_INVALID_OUTCOME: u64 = 2;

// ============ Structs ============

/// World Table: Maps world outcomes to their meanings
/// Index 0 = 000 (A no, B no, C no)
/// Index 1 = 001 (A no, B no, C yes)
/// Index 2 = 010 (A no, B yes, C no)
/// Index 3 = 011 (A no, B yes, C yes)
/// Index 4 = 100 (A yes, B no, C no)
/// Index 5 = 101 (A yes, B no, C yes)
/// Index 6 = 110 (A yes, B yes, C no)
/// Index 7 = 111 (A yes, B yes, C yes)

/// Prediction Market Pool
public struct Pool<phantom T> has key {
    id: UID,
    /// Shares for each of the 8 world outcomes (q values)
    /// q[0] = shares for world 000
    /// q[1] = shares for world 001
    /// ... etc
    q: vector<u64>,
    /// Probability for each of the 8 world outcomes (fixed, initialized at 12.5%)
    /// p[0] = probability for world 000
    /// p[1] = probability for world 001
    /// ... etc
    probabilities: vector<u64>,
    /// Token reserve (collateral)
    reserve: Balance<T>,
    /// Total shares issued per outcome (tracks maker's shares)
    total_shares_per_outcome: u64
}

// ============ Pool Functions ============

/// Create a new prediction market pool
/// Initializes all 8 world outcomes with 12.5% probability each
/// The maker provides initial_amount and receives initial_amount shares for each of the 8 outcomes
public entry fun create_pool<T>(initial_amount: u64, payment: Coin<T>, ctx: &mut TxContext) {
    assert!(initial_amount > 0, E_INVALID_AMOUNT);
    
    // Initialize shares (q values) for each outcome
    let mut q = vector::empty<u64>();
    let mut i = 0u64;
    while (i < N) {
        vector::push_back(&mut q, initial_amount);
        i = i + 1;
    };

    // Initialize probabilities at 12.5% each (sum = 100%)
    let mut probabilities = vector::empty<u64>();
    let mut j = 0u64;
    while (j < N) {
        vector::push_back(&mut probabilities, INITIAL_PROBABILITY);
        j = j + 1;
    };

    let pool = Pool<T> {
        id: object::new(ctx),
        q,
        probabilities,
        reserve: coin::into_balance(payment),
        total_shares_per_outcome: initial_amount
    };

    transfer::share_object(pool);
}

/// Maker adds liquidity: puts x amount of money, gets x shares for EACH outcome
/// This does NOT change the probabilities - they stay fixed
public entry fun add_shares<T>(
    pool: &mut Pool<T>,
    amount: u64,
    payment: Coin<T>,
    _ctx: &mut TxContext
) {
    assert!(amount > 0, E_INVALID_AMOUNT);
    
    // Add 'amount' shares to each of the 8 outcomes
    let mut i = 0u64;
    while (i < N) {
        let qi = vector::borrow_mut(&mut pool.q, i);
        *qi = *qi + amount;
        i = i + 1;
    };
    
    // Update total shares per outcome
    pool.total_shares_per_outcome = pool.total_shares_per_outcome + amount;
    
    // Add payment to reserve
    balance::join(&mut pool.reserve, coin::into_balance(payment));
    
    // Note: Probabilities remain unchanged at 12.5% each
}

/// Set probability for a specific outcome (admin function)
/// Probability is in fixed-point format (e.g., 0.125 = 125_000_000)
public entry fun set_probability<T>(
    pool: &mut Pool<T>,
    outcome: u64,
    probability: u64,
    _ctx: &mut TxContext
) {
    assert!(outcome < N, E_INVALID_OUTCOME);
    
    let prob = vector::borrow_mut(&mut pool.probabilities, outcome);
    *prob = probability;
}

// ============ View Functions ============

/// Get the shares (q values) for all 8 outcomes
public fun get_shares<T>(pool: &Pool<T>): vector<u64> {
    pool.q
}

/// Get the probabilities for all 8 outcomes
public fun get_probabilities<T>(pool: &Pool<T>): vector<u64> {
    pool.probabilities
}

/// Get shares for a specific outcome (0-7)
public fun get_outcome_shares<T>(pool: &Pool<T>, outcome: u64): u64 {
    assert!(outcome < N, E_INVALID_OUTCOME);
    *vector::borrow(&pool.q, outcome)
}

/// Get probability for a specific outcome (0-7)
public fun get_outcome_probability<T>(pool: &Pool<T>, outcome: u64): u64 {
    assert!(outcome < N, E_INVALID_OUTCOME);
    *vector::borrow(&pool.probabilities, outcome)
}

/// Get the reserve balance
public fun get_reserve<T>(pool: &Pool<T>): u64 {
    balance::value(&pool.reserve)
}


public fun get_total_shares_per_outcome<T>(pool: &Pool<T>): u64 {
    pool.total_shares_per_outcome
}


// ============ Derived Probabilities (Marginals) ============

/// Calculate P(A=Yes) = p[4] + p[5] + p[6] + p[7]
public fun get_marginal_a<T>(pool: &Pool<T>): u64 {
    let p = &pool.probabilities;
    *vector::borrow(p, 4) + *vector::borrow(p, 5) + *vector::borrow(p, 6) + *vector::borrow(p, 7)
}

/// Calculate P(B=Yes) = p[2] + p[3] + p[6] + p[7]
public fun get_marginal_b<T>(pool: &Pool<T>): u64 {
    let p = &pool.probabilities;
    *vector::borrow(p, 2) + *vector::borrow(p, 3) + *vector::borrow(p, 6) + *vector::borrow(p, 7)
}

/// Calculate P(C=Yes) = p[1] + p[3] + p[5] + p[7]
public fun get_marginal_c<T>(pool: &Pool<T>): u64 {
    let p = &pool.probabilities;
    *vector::borrow(p, 1) + *vector::borrow(p, 3) + *vector::borrow(p, 5) + *vector::borrow(p, 7)
}
