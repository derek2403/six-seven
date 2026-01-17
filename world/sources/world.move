module world::world {
    use std::string::String;
    use sui::table::{Self, Table};
    use token::vault::{Self, Ledger};

    // ======== Error Codes ========
    const EInvalidProbabilities: u64 = 0;
    const EPoolNotFound: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EInvalidOutcome: u64 = 3;

    // ======== Structs ========

    public struct World has key {
        id: UID,
        /// Mapping from Pool ID to Pool
        pools: Table<u64, Pool>,
        /// Counter for pool IDs
        pool_count: u64,
        /// Mapping from Maker address to list of Pool IDs they created
        maker_registry: Table<address, vector<u64>>,
    }

    /// outcome_id mapping:
    /// 0=000, 1=001, 2=010, 3=011, 4=100, 5=101, 6=110, 7=111
    public struct Pool has store {
        id: u64,
        title: String,
        image_url: String,
        description: String,
        /// Liquidity amount (accounting only, funds stay in Vault)
        liquidity: u64,
        volume: u64,
        created_at: u64,
        resolve_at: u64,
        /// Shares for each outcome (0-7)
        shares: Table<u8, u64>,
        /// Probabilities for each outcome (scaled by 10000, e.g. 1200 = 0.12)
        probabilities: Table<u8, u64>,
    }

    // ======== Init ========

    fun init(ctx: &mut TxContext) {
        let world = World {
            id: object::new(ctx),
            pools: table::new(ctx),
            pool_count: 0,
            maker_registry: table::new(ctx),
        };
        transfer::share_object(world);
    }

    // ======== Public Functions ========

    /// Create a new prediction pool
    public fun create_pool(
        world: &mut World,
        title: String,
        image_url: String,
        description: String,
        resolve_at: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let pool_id = world.pool_count;
        world.pool_count = world.pool_count + 1;

        let mut shares: Table<u8, u64> = table::new(ctx);
        let mut probabilities: Table<u8, u64> = table::new(ctx);

        // Initialize 8 outcomes (0..7) with 0 shares and 0.12 probability (1200 bp)
        let mut i: u64 = 0;
        while (i < 8) {
            let outcome_id = (i as u8);
            table::add(&mut shares, outcome_id, 0);
            table::add(&mut probabilities, outcome_id, 1200); // 0.12 * 10000
            i = i + 1;
        };

        let pool = Pool {
            id: pool_id,
            title,
            image_url,
            description,
            liquidity: 0,
            volume: 0,
            created_at: sui::clock::timestamp_ms(clock),
            resolve_at,
            shares,
            probabilities,
        };

        table::add(&mut world.pools, pool_id, pool);

        // Record maker
        let sender = tx_context::sender(ctx);
        if (!table::contains(&world.maker_registry, sender)) {
            table::add(&mut world.maker_registry, sender, vector::empty());
        };
        let user_pools = table::borrow_mut(&mut world.maker_registry, sender);
        vector::push_back(user_pools, pool_id);
    }

    /// Provide liquidity to a pool
    /// Deducts from user's vault balance (accounting) and adds to pool liquidity
    /// User receives shares for all outcomes proportional to liquidity provided
    public fun provide_liquidity(
        world: &mut World,
        ledger: &mut Ledger,
        pool_id: u64,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&world.pools, pool_id), EPoolNotFound);

        let sender = tx_context::sender(ctx);

        // 1. Check and deduct balance from Vault Ledger
        let current_balance = vault::get_withdrawable_amount(ledger, sender);
        assert!(current_balance >= amount, EInsufficientBalance);

        vault::set_withdrawable_balance(ledger, sender, current_balance - amount);

        // 2. Add to Pool liquidity
        let pool = table::borrow_mut(&mut world.pools, pool_id);
        pool.liquidity = pool.liquidity + amount;

        // 3. Distribute shares: user gets `amount` shares for EACH outcome
        let mut i: u64 = 0;
        while (i < 8) {
            let outcome_id = (i as u8);
            assert!(table::contains(&pool.shares, outcome_id), EInvalidOutcome);

            let sref = table::borrow_mut(&mut pool.shares, outcome_id);
            *sref = *sref + amount;

            i = i + 1;
        };
    }

    /// Update probabilities for a pool
    /// Expects a vector of 8 probabilities (scaled by 10000) corresponding to outcome_id 0..7
    public fun update_prob(
        world: &mut World,
        pool_id: u64,
        new_probs: vector<u64>,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&world.pools, pool_id), EPoolNotFound);
        assert!(vector::length(&new_probs) == 8, EInvalidProbabilities);

        let pool = table::borrow_mut(&mut world.pools, pool_id);

        let mut i: u64 = 0;
        while (i < 8) {
            let outcome_id = (i as u8);
            let prob = *vector::borrow(&new_probs, i);

            assert!(table::contains(&pool.probabilities, outcome_id), EInvalidOutcome);
            let pref = table::borrow_mut(&mut pool.probabilities, outcome_id);
            *pref = prob;

            i = i + 1;
        };
    }
}
