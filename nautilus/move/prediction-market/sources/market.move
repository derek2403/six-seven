/// Private Prediction Market with Unified Liquidity
/// 
/// This contract handles:
/// - User deposits
/// - Submitting TEE-signed bets
/// - Price updates
/// - Settlement and claims
module app::market {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use enclave::enclave::{Self, Enclave};
    use std::string::String;
    
    // Custom USDC token type
    use usdc::usdc::USDC;

    // ============================================================
    // CONSTANTS - Must match Rust IntentScope
    // ============================================================
    const INTENT_PLACE_BET: u8 = 0;
    const INTENT_CLAIM_PROOF: u8 = 1;

    // Error codes
    const EInvalidSignature: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EMarketNotResolved: u64 = 3;
    const EAlreadyClaimed: u64 = 4;
    const EInvalidCommitment: u64 = 5;

    // ============================================================
    // STRUCTS
    // ============================================================
    
    /// One-Time Witness for creating EnclaveConfig
    public struct MARKET has drop {}

    /// Main market state (shared object)
    public struct Market has key {
        id: UID,
        /// Total liquidity pool (USDC)
        pool: Balance<USDC>,
        /// User balances (deposited but not yet bet)
        balances: Table<address, u64>,
        /// User commitments (hash of their positions)
        commitments: Table<address, vector<String>>,
        /// Current prices (8 values for 3 events, scaled by 1_000_000)
        prices: vector<u64>,
        /// Winning world (0-7), only set after resolution
        winning_world: Option<u8>,
        /// Market status
        resolved: bool,
    }

    /// Response struct for place_bet - MUST match Rust PlaceBetResponse
    public struct PlaceBetResponse has copy, drop {
        shares: u64,
        new_prices: vector<u64>,
        commitment: String,
        worlds: vector<u8>,
    }

    /// Response struct for claim - MUST match Rust ClaimProofResponse
    public struct ClaimProofResponse has copy, drop {
        user: String,
        winning_world: u8,
        shares: u64,
        payout: u64,
        commitment: String,
    }

    /// Admin capability for resolving market
    public struct AdminCap has key, store {
        id: UID,
    }

    // ============================================================
    // INIT
    // ============================================================
    
    fun init(otw: MARKET, ctx: &mut TxContext) {
        // Create enclave config
        let cap = enclave::new_cap(otw, ctx);
        cap.create_enclave_config(
            b"prediction market enclave".to_string(),
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            ctx,
        );
        transfer::public_transfer(cap, ctx.sender());

        // Create market
        let market = Market {
            id: object::new(ctx),
            pool: balance::zero(),
            balances: table::new(ctx),
            commitments: table::new(ctx),
            prices: vector[125000, 125000, 125000, 125000, 125000, 125000, 125000, 125000], // Uniform 1/8
            winning_world: option::none(),
            resolved: false,
        };
        transfer::share_object(market);

        // Create admin cap
        let admin = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin, ctx.sender());
    }

    // ============================================================
    // USER FUNCTIONS
    // ============================================================

    /// Deposit USDC to get betting balance
    public entry fun deposit(
        market: &mut Market,
        payment: Coin<USDC>,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        let amount = coin::value(&payment);
        
        // Add to pool
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut market.pool, payment_balance);
        
        // Update user balance
        if (table::contains(&market.balances, sender)) {
            let current = table::borrow_mut(&mut market.balances, sender);
            *current = *current + amount;
        } else {
            table::add(&mut market.balances, sender, amount);
        };
    }

    /// Submit a bet that was processed by TEE
    /// The TEE has already calculated shares and new prices
    public entry fun submit_bet<T>(
        market: &mut Market,
        enclave: &Enclave<T>,
        amount: u64,
        shares: u64,
        new_prices: vector<u64>,
        commitment: String,
        worlds: vector<u8>,
        timestamp_ms: u64,
        sig: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        
        // Verify TEE signature
        let response = PlaceBetResponse {
            shares,
            new_prices,
            commitment,
            worlds,
        };
        let verified = enclave.verify_signature(
            INTENT_PLACE_BET,
            timestamp_ms,
            response,
            &sig,
        );
        assert!(verified, EInvalidSignature);

        // Deduct from user balance
        assert!(table::contains(&market.balances, sender), EInsufficientBalance);
        let balance = table::borrow_mut(&mut market.balances, sender);
        assert!(*balance >= amount, EInsufficientBalance);
        *balance = *balance - amount;

        // Store commitment
        if (!table::contains(&market.commitments, sender)) {
            table::add(&mut market.commitments, sender, vector::empty());
        };
        let user_commits = table::borrow_mut(&mut market.commitments, sender);
        vector::push_back(user_commits, commitment);

        // Update prices
        market.prices = new_prices;
    }

    /// Get current prices (view function)
    public fun get_prices(market: &Market): vector<u64> {
        market.prices
    }

    /// Get user's deposited balance
    public fun get_balance(market: &Market, user: address): u64 {
        if (table::contains(&market.balances, user)) {
            *table::borrow(&market.balances, user)
        } else {
            0
        }
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /// Resolve the market with winning world (0-7)
    public entry fun resolve(
        _admin: &AdminCap,
        market: &mut Market,
        winning_world: u8,
    ) {
        market.winning_world = option::some(winning_world);
        market.resolved = true;
    }

    // ============================================================
    // CLAIM FUNCTIONS
    // ============================================================

    /// Claim winnings with TEE-signed proof
    public entry fun claim<T>(
        market: &mut Market,
        enclave: &Enclave<T>,
        user_str: String,
        winning_world: u8,
        shares: u64,
        payout: u64,
        commitment: String,
        timestamp_ms: u64,
        sig: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        
        // Market must be resolved
        assert!(market.resolved, EMarketNotResolved);
        
        // Winning world must match
        let actual_winner = option::borrow(&market.winning_world);
        assert!(*actual_winner == winning_world, EInvalidCommitment);

        // Verify TEE signature for claim
        let response = ClaimProofResponse {
            user: user_str,
            winning_world,
            shares,
            payout,
            commitment,
        };
        let verified = enclave.verify_signature(
            INTENT_CLAIM_PROOF,
            timestamp_ms,
            response,
            &sig,
        );
        assert!(verified, EInvalidSignature);

        // Verify commitment exists
        assert!(table::contains(&market.commitments, sender), EInvalidCommitment);
        // Note: In production, you'd verify the specific commitment matches

        // Pay out
        let payout_coin = coin::take(&mut market.pool, payout, ctx);
        transfer::public_transfer(payout_coin, sender);
    }

    // ============================================================
    // TESTS
    // ============================================================
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(MARKET {}, ctx);
    }
}
