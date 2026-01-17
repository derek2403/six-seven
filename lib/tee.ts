export const TEE_CONFIG = {
    // Packages
    MARKET_PACKAGE: '0x3757c5b83a2d4606659e17a8130cc3022e398cb092830fe93a186171d4d2cdb8',
    ENCLAVE_PACKAGE: '0x8b46d0f2d32974451336e0ede960ccd1714d6b9c3580715863bb2e303fa4795a',

    // Shared Objects
    MARKET_OBJECT_ID: '0xbaaada92a105f8ae69c14323ace0e003b6d14898820b916fcbdcafba87195b35',
    ENCLAVE_CONFIG_ID: '0x48e625408db3aa995ed216f9e273956a7cba6e9ac9604a458df493a49591d7e4',

    // Live Enclave Instance (Registered with Current TEE Key)
    // Updated: 2026-01-17 (Fixes EInvalidSignature)
    ENCLAVE_OBJECT_ID: '0x9c0e780d4ba223b3e5e8c8a62ba30d9b31fde3105ae6ac914587121c5855d931',

    // Endpoints
    TEE_URL: 'http://44.211.226.223:3000',
};

// Helper for consistency
export const CONTRACTS = {
    MARKET: {
        packageId: TEE_CONFIG.MARKET_PACKAGE,
        marketId: TEE_CONFIG.MARKET_OBJECT_ID,
    },
    ENCLAVE: {
        packageId: TEE_CONFIG.ENCLAVE_PACKAGE,
        configId: TEE_CONFIG.ENCLAVE_CONFIG_ID,
        objectId: TEE_CONFIG.ENCLAVE_OBJECT_ID,
    }
};
