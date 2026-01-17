module lmsr::simple_lmsr;

use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};

const SCALE: u64 = 1_000_000_000;
const N: u64 = 8;

public struct Market<T> has key {
    id: UID,
    b: u64,              // liquidity depth
    q: vector<u64>,     // 8 outcome quantities
    reserve: Balance<T>
}

public entry fun create<T>(b: u64, ctx: &mut TxContext) {
    let mut q = vector::empty<u64>();
    let i = 0;
    while (i < N) {
        vector::push_back(&mut q, 0);
        i = i + 1;
    };

    let m = Market<T> {
        id: object::new(ctx),
        b,
        q,
        reserve: balance::zero<T>()
    };

    transfer::share_object(m);
}

/// User buys a slice (bitmask), paying fixed amount, q updates
public entry fun buy<T>(
    market: &mut Market<T>,
    mask: u8,
    delta: u64,
    payment: Coin<T>
) {
    let i = 0;
    while (i < N) {
        let bit = ((mask >> (i as u8)) & 1);
        if (bit == 1) {
            let qi = vector::borrow_mut(&mut market.q, i);
            *qi = *qi + delta;
        };
        i = i + 1;
    };

    balance::join(&mut market.reserve, coin::into_balance(payment));
}

/// Softmax prices
public fun prices<T>(market: &Market<T>): vector<u64> {
    let mut exps = vector::empty<u64>();
    let mut sum = 0;

    let i = 0;
    while (i < N) {
        let qi = *vector::borrow(&market.q, i);
        let e = exp(qi / market.b);   // placeholder exp
        vector::push_back(&mut exps, e);
        sum = sum + e;
        i = i + 1;
    };

    let mut p = vector::empty<u64>();
    let j = 0;
    while (j < N) {
        let price = (vector::borrow(&exps, j) * SCALE) / sum;
        vector::push_back(&mut p, price);
        j = j + 1;
    };

    p
}
