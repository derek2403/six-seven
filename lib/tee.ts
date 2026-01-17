// TEE and Smart Contract Configuration
// Updated: 2026-01-17 for Federated Architecture

import { VAULT_CONFIG, WORLD_CONFIG, USDC_CONFIG } from './config';

export const TEE_CONFIG = {
    // TEE Endpoint
    TEE_URL: 'http://100.24.10.33:3000',

    // TEE Public Key (from /health_check response)
    // This key is used to verify signed responses client-side if needed
    TEE_PK: 'b43c337248a108e6ef6bf831da08eb4c207f9972740e0411439fea0f898f8cdd',

    // Enclave Package (for on-chain signature verification - requires production Nitro)
    ENCLAVE_PACKAGE: '0x3a0c541676d4844f1296e92b28163ea079f45b77867599724f141322ff3e8a41',
    ENCLAVE_CONFIG_ID: '0x15a2d73dbecf428e2856ff88db6648bb7bb6716129b2c8347c9ff50e6b4163e5',
    ENCLAVE_OBJECT_ID: '0x9db6f3758c5fd0d8ef9aa4866b43cb4f2b0b9845022d42d4017ec7bb1df6326d', // Registered!

    // PM Contract Package
    PM_PACKAGE: '0x327d01aa4fdc8cba53596b225510a6b5afc5d2266227654574fe6347a45d3973',
};

// Alias for backward compatibility
export const PM_CONFIG = TEE_CONFIG;

// Re-export external contract configs for convenience
export const VAULT = VAULT_CONFIG;
export const WORLD = WORLD_CONFIG;
export const USDC = USDC_CONFIG;

// All contract IDs in one place
export const CONTRACTS = {
    TEE: {
        url: TEE_CONFIG.TEE_URL,
        enclavePackage: TEE_CONFIG.ENCLAVE_PACKAGE,
        enclaveConfig: TEE_CONFIG.ENCLAVE_CONFIG_ID,
        enclaveObject: TEE_CONFIG.ENCLAVE_OBJECT_ID,
    },
    VAULT: {
        packageId: VAULT_CONFIG.PACKAGE_ID,
        module: VAULT_CONFIG.MODULE_NAME,
        vaultId: VAULT_CONFIG.VAULT_ID,
        ledgerId: VAULT_CONFIG.LEDGER_ID,
    },
    WORLD: {
        packageId: WORLD_CONFIG.PACKAGE_ID,
        module: WORLD_CONFIG.MODULE_NAME,
        worldId: WORLD_CONFIG.WORLD_ID,
    },
    USDC: {
        packageId: USDC_CONFIG.PACKAGE_ID,
        type: USDC_CONFIG.USDC_TYPE,
        treasuryCap: USDC_CONFIG.TREASURY_CAP_ID,
    }
};

// Types for TEE requests/responses
export interface PlaceBetRequest {
    user: string;
    pool_id: number;
    outcome: number;
    amount: number;
    maker: string;
    current_probs: number[];
}

export interface PlaceBetResponse {
    shares: number;
    new_probs: number[];
    pool_id: number;
    outcome: number;
    debit_amount: number;
    credit_amount: number;
}

export interface ResolveRequest {
    pool_id: number;
    winning_outcome: number;
}

export interface Payout {
    user: string;
    amount: number;
}

export interface ResolveResponse {
    success: boolean;
    pool_id: number;
    winning_outcome: number;
    payouts: Payout[];
    total_payout: number;
}

export interface AttestationRequest {
    challenge: string; // Hex string or just bytes
}

export interface AttestationResponse {
    attestation_doc: string; // Base64 encoded
}

export interface Position {
    wallet: string;
    pool_id: number;
    outcome: number;
    shares: number;
}

export interface GetPositionsParams {
    pool_id: number;
}
