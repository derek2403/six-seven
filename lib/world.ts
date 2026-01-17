import { Transaction } from "@mysten/sui/transactions";
import { WORLD_CONFIG, VAULT_CONFIG } from "./config";

export interface Pool {
    id: string;
    title: string;
    image_url: string;
    description: string;
    liquidity: string;
    volume: string;
    created_at: string;
    resolve_at: string;
    shares: Record<string, string>; // outcome_id -> amount
    probabilities: Record<string, string>; // outcome_id -> probability (scaled by 10000)
}

export interface World {
    id: string;
    pool_count: string;
    pools: Record<string, Pool>;
    maker_registry: Record<string, string[]>;
}

export const buildCreatePoolTransaction = (
    title: string,
    imageUrl: string,
    description: string,
    resolveAt: number
) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${WORLD_CONFIG.PACKAGE_ID}::${WORLD_CONFIG.MODULE_NAME}::create_pool`,
        arguments: [
            tx.object(WORLD_CONFIG.WORLD_ID),
            tx.pure.string(title),
            tx.pure.string(imageUrl),
            tx.pure.string(description),
            tx.pure.u64(resolveAt),
            tx.object("0x6"), // Clock object ID
        ],
    });

    return tx;
};

export const buildProvideLiquidityTransaction = (
    poolId: string,
    amount: bigint
) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${WORLD_CONFIG.PACKAGE_ID}::${WORLD_CONFIG.MODULE_NAME}::provide_liquidity`,
        arguments: [
            tx.object(WORLD_CONFIG.WORLD_ID),
            tx.object(VAULT_CONFIG.LEDGER_ID), // Ledger is needed for balance deduction
            tx.pure.u64(poolId),
            tx.pure.u64(amount),
        ],
    });

    return tx;
};

export const buildUpdateProbTransaction = (
    poolId: string,
    newProbs: number[] // Array of 8 numbers, scaled by 10000
) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${WORLD_CONFIG.PACKAGE_ID}::${WORLD_CONFIG.MODULE_NAME}::update_prob`,
        arguments: [
            tx.object(WORLD_CONFIG.WORLD_ID),
            tx.pure.u64(poolId),
            tx.pure.vector("u64", newProbs),
        ],
    });

    return tx;
};
