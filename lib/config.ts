// Sui Contract Configuration
// Contains deployed contract addresses and object IDs

// Package ID for both USDC and Vault modules
export const PACKAGE_ID = "0x376898554ee5778bccb1926e5203ab6f8608e0feb3a53b8b1b79873b50eefc51";

export const USDC_CONFIG = {
    // Package ID for the deployed USDC module
    PACKAGE_ID: PACKAGE_ID,

    // Module name
    MODULE_NAME: "usdc",

    // Shared TreasuryCap object ID (used to mint USDC)
    TREASURY_CAP_ID: "0x73bb36acf52f07030e2eca7943050caf1ba0d2d89a0c53611fd48fb3c82e79be",

    // Coin metadata ID (immutable)
    COIN_METADATA_ID: "0x7119f11a2179d5dad2daa1e94812b0eb9174091a4d4714b6e59b8d185b288cb1",

    // USDC type for coin operations
    USDC_TYPE: `${PACKAGE_ID}::usdc::USDC`,

    // Decimals (same as real USDC)
    DECIMALS: 6,
};

export const VAULT_CONFIG = {
    // Package ID for the deployed vault module
    PACKAGE_ID: PACKAGE_ID,

    // Module name
    MODULE_NAME: "vault",

    // Shared Vault object ID
    VAULT_ID: "0x15be8234404447fab9bbcc876e8eb66dd1000782332a8aeafe3f520ad7bb75e3",

    // Shared Ledger object ID
    LEDGER_ID: "0x537654bf8d72f1fef3e036f2405efb3750f3d1d5ada3225f326abdfcf64ea214",
};

// MAKER (Prediction Market Pool) Contract Configuration
export const MAKER_CONFIG = {
    // Package ID for the deployed maker module (Testnet)
    PACKAGE_ID: "0xc5197765b0597ec1f3d744d08188d1bf084c4fb3cf3bffcc7b0530b0bfff46b5",

    // Module name
    MODULE_NAME: "maker",

    // Number of outcomes (8 worlds for 3 binary events)
    OUTCOMES: 8,

    // Fixed-point scale (9 decimals)
    SCALE: 1_000_000_000,

    // Initial probability for each outcome: 12.5%
    INITIAL_PROBABILITY: 125_000_000,
};
