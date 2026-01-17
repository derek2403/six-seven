// Sui Contract Configuration
// Contains deployed contract addresses and object IDs

// Package ID for both USDC and Vault modules
export const PACKAGE_ID = "0xbf298f701d3494c4411e68e72161d4d5a7495bbd93c9d8639050bbc8ac42881a";

export const USDC_CONFIG = {
    // Package ID for the deployed USDC module
    PACKAGE_ID: PACKAGE_ID,

    // Module name
    MODULE_NAME: "usdc",

    // Shared TreasuryCap object ID (used to mint USDC)
    TREASURY_CAP_ID: "0x000c278367691a40592da6c6c560d3a3d50b5d511d9aabfd549b14aa81727ee5",

    // Coin metadata ID (immutable)
    COIN_METADATA_ID: "0xf45f985e6120e9e60939820b1fe793b8b7498f782e282b51a431df4b243a0c57",

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
    VAULT_ID: "0xe15931d233831ef86894d072b1767103ddf0b13a470b03d96812c2768faee17e",
};
