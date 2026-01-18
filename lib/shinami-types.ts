/**
 * Type definitions for Shinami Gas Station integration
 */

/**
 * Request body for building a sponsored bet transaction
 */
export interface BuildSponsoredBetTxRequest {
    sender: string;
    poolId: number;
    outcome: number;
    amount: number; // in USDC (smallest unit)
    maker: string;
    currentProbs: number[];
    // TEE response data
    teeResponse: {
        shares: number;
        newProbs: number[];
        debitAmount: number;
        creditAmount: number;
        timestampMs: number;
    };
    teeSignature: string;
    // Balance data for vault updates
    userNewBalance: string;
    makerNewBalance: string;
}

/**
 * Request body for building a sponsored deposit transaction
 */
export interface BuildSponsoredDepositTxRequest {
    sender: string;
    amount: string; // in smallest unit (MIST for SUI, or USDC units)
    coinObjectIds: string[];
}

/**
 * Request body for building a sponsored withdraw transaction  
 */
export interface BuildSponsoredWithdrawTxRequest {
    sender: string;
    amount: string;
}

/**
 * Response from building a sponsored transaction
 */
export interface BuildSponsoredTxResponse {
    txBytes: string;
    sponsorSignature: string;
    digest: string;
}

/**
 * Request body for executing a sponsored transaction
 */
export interface ExecuteSponsoredTxRequest {
    txBytes: string;
    sponsorSignature: string;
    senderSignature: string;
}

/**
 * Response from executing a sponsored transaction
 */
export interface ExecuteSponsoredTxResponse {
    digest: string;
    effects: any;
    [key: string]: any;
}

/**
 * Error response
 */
export interface SponsoredTxErrorResponse {
    error: string;
    details?: any;
}
