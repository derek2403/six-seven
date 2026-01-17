/// PM (Prediction Market) Contract with On-Chain Signature Verification
/// 
/// This contract verifies TEE signatures before updating market state.
/// TEE calculates LMSR pricing and signs responses.
module pm::pm {
    use enclave::enclave::{Self, Enclave, Cap};
    use std::string::String;
    use std::vector;

    // Intent scopes - must match Rust
    const INTENT_PLACE_BET: u8 = 0;
    const INTENT_RESOLVE: u8 = 1;

    // Error codes
    const EInvalidSignature: u64 = 1;

    /// One-Time Witness for creating EnclaveConfig
    public struct PM has drop {}

    /// Response struct for place_bet - MUST match Rust PlaceBetResponse exactly
    /// Field order and types must be identical for BCS serialization
    public struct PlaceBetResponse has copy, drop {
        shares: u64,
        new_probs: vector<u64>,
        pool_id: u64,
        outcome: u8,
        debit_amount: u64,
        credit_amount: u64,
    }

    /// Payout info for a winner - Match Rust
    public struct Payout has copy, drop {
        user: String,
        amount: u64,
    }

    /// Response after resolving - Match Rust ResolveResponse
    public struct ResolveResponse has copy, drop {
        success: bool,
        pool_id: u64,
        winning_outcome: u8,
        payouts: vector<Payout>,
        total_payout: u64,
    }

    // ============================================================
    // INIT - Creates EnclaveConfig
    // ============================================================
    
    fun init(otw: PM, ctx: &mut TxContext) {
        // Create enclave config with debug PCRs (all zeros)
        let cap = enclave::new_cap(otw, ctx);
        cap.create_enclave_config(
            b"PM Prediction Market".to_string(),
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            ctx,
        );
        
        // Transfer cap to sender
        transfer::public_transfer(cap, ctx.sender());
    }

    // ============================================================
    // SUBMIT BET - Verifies TEE signature
    // ============================================================
    
    /// Submit a bet with TEE-signed proof
    /// Frontend calls this after receiving signed response from TEE
    /// After verification, frontend should call vault and world contracts
    public entry fun submit_bet<T>(
        enclave: &Enclave<T>,
        // PlaceBetResponse fields
        shares: u64,
        new_probs: vector<u64>,
        pool_id: u64,
        outcome: u8,
        debit_amount: u64,
        credit_amount: u64,
        // Signature data
        timestamp_ms: u64,
        sig: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        // Reconstruct the response struct
        let response = PlaceBetResponse {
            shares,
            new_probs,
            pool_id,
            outcome,
            debit_amount,
            credit_amount,
        };

        // Verify TEE signature
        let verified = enclave.verify_signature(
            INTENT_PLACE_BET,
            timestamp_ms,
            response,
            &sig,
        );
        assert!(verified, EInvalidSignature);

        // Signature verified!
        // The frontend can now safely call vault::set_withdrawable_balance
        // and world::update_prob with the verified data
    }

    /// Resolve market with TEE-signed proof
    public entry fun resolve_market<T>(
        enclave: &Enclave<T>,
        // ResolveResponse fields
        success: bool,
        pool_id: u64,
        winning_outcome: u8,
        payout_users: vector<String>, 
        payout_amounts: vector<u64>,
        total_payout: u64,
        // Signature data
        timestamp_ms: u64,
        sig: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        // Reconstruct Payouts
        let mut payouts = vector::empty<Payout>();
        let len = vector::length(&payout_users);
        let mut i = 0;
        while (i < len) {
            let user = *vector::borrow(&payout_users, i);
            let amount = *vector::borrow(&payout_amounts, i);
            vector::push_back(&mut payouts, Payout { user, amount });
            i = i + 1;
        };

        let response = ResolveResponse {
            success,
            pool_id,
            winning_outcome,
            payouts,
            total_payout,
        };

        // Verify TEE signature
        let verified = enclave.verify_signature(
            INTENT_RESOLVE,
            timestamp_ms,
            response,
            &sig,
        );
        assert!(verified, EInvalidSignature);
    }

    // ============================================================
    // TEST HELPERS
    // ============================================================
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(PM {}, ctx);
    }
}
