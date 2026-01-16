// Sui Contract Configuration
// Contains deployed contract addresses and object IDs

export const USDC_CONFIG = {
    // Package ID for the deployed USDC module
    PACKAGE_ID: "0xb92db9323a9c5f9621726915ecfdfb048adf5b58a88797dfd4fa49ad2695d4be",

    // Module name
    MODULE_NAME: "usdc",

    // Shared TreasuryCap object ID (used to mint USDC)
    TREASURY_CAP_ID: "0x4573415f41670ae8d4319ff38e366dcb31b8625098d6fd17d70475e552ec0b5c",

    // Coin metadata ID (immutable)
    COIN_METADATA_ID: "0xb407e38f27ab491fa34df1971b053dcc29a2440b72d2f2a4b98687ac1d67182f",

    // USDC type for coin operations
    USDC_TYPE: "0xb92db9323a9c5f9621726915ecfdfb048adf5b58a88797dfd4fa49ad2695d4be::usdc::USDC",

    // Decimals (same as real USDC)
    DECIMALS: 6,
};
