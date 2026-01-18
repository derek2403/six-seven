/// Mock USDC Token Module for Sui
#[allow(deprecated_usage, lint(public_entry))]
module token::usdc {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url;

    /// The type identifier of coin. The coin will have a type
    /// tag of kind: `Coin<package_object::usdc::USDC>`
    /// Make sure that the name of the type matches the module's name.
    public struct USDC has drop {}

    /// Module initializer is called once on module publish. A treasury
    /// cap is sent to the publisher, who then controls minting and burning.
    fun init(witness: USDC, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            6, // 6 decimals like real USDC
            b"USDC",
            b"USD Coin",
            b"Mock USDC for testing",
            option::some(url::new_unsafe_from_bytes(b"https://cryptologos.cc/logos/usd-coin-usdc-logo.png")),
            ctx
        );
        
        // Freeze the metadata to prevent further changes
        transfer::public_freeze_object(metadata);
        
        // Share the treasury cap so anyone can mint (for testing purposes)
        transfer::public_share_object(treasury);
    }

    /// Mint 1000 USDC (with 6 decimals = 1_000_000_000 base units) to the caller's address
    public entry fun mint_1000_usdc(
        treasury_cap: &mut TreasuryCap<USDC>,
        ctx: &mut TxContext
    ) {
        // 1000 USDC = 1000 * 10^6 = 1_000_000_000 base units
        let amount: u64 = 1_000_000_000;
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    /// Mint a custom amount of USDC to a specified recipient
    public entry fun mint_to(
        treasury_cap: &mut TreasuryCap<USDC>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// Burn USDC tokens
    public entry fun burn(
        treasury_cap: &mut TreasuryCap<USDC>,
        coin: Coin<USDC>
    ) {
        coin::burn(treasury_cap, coin);
    }
}
