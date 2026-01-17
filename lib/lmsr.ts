import { Transaction } from '@mysten/sui/transactions';
import { LMSR_CONFIG, USDC_CONFIG } from './config';

/**
 * LMSR Package ID
 */
export const LMSR_PACKAGE_ID = LMSR_CONFIG.PACKAGE_ID;

/**
 * LMSR AMM type for the USDC coin type
 */
export const LMSR_AMM_TYPE = `${LMSR_PACKAGE_ID}::lmsr::LMSR<${USDC_CONFIG.USDC_TYPE}>`;

/**
 * Build a transaction to create a new LMSR AMM with given liquidity parameter b
 * @param b Liquidity depth parameter (higher = more stable prices)
 * @returns Transaction object ready to be signed and executed
 */
export const buildCreateAmmTransaction = (b: bigint): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${LMSR_PACKAGE_ID}::${LMSR_CONFIG.MODULE_NAME}::create_amm`,
        typeArguments: [USDC_CONFIG.USDC_TYPE],
        arguments: [
            tx.pure.u64(b),
        ],
    });

    return tx;
};

/**
 * Build a transaction to buy shares of a specific outcome
 * @param ammObjectId The LMSR AMM object ID
 * @param outcome The outcome index (0-7)
 * @param amount The number of shares to buy
 * @param paymentCoinId The USDC coin object ID to pay with
 * @returns Transaction object ready to be signed and executed
 */
export const buildBuyTransaction = (
    ammObjectId: string,
    outcome: number,
    amount: bigint,
    paymentCoinId: string
): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${LMSR_PACKAGE_ID}::${LMSR_CONFIG.MODULE_NAME}::buy`,
        typeArguments: [USDC_CONFIG.USDC_TYPE],
        arguments: [
            tx.object(ammObjectId),
            tx.pure.u64(outcome),
            tx.pure.u64(amount),
            tx.object(paymentCoinId),
        ],
    });

    return tx;
};

/**
 * Build a transaction to sell shares of a specific outcome
 * @param ammObjectId The LMSR AMM object ID
 * @param outcome The outcome index (0-7)
 * @param amount The number of shares to sell
 * @returns Transaction object ready to be signed and executed
 */
export const buildSellTransaction = (
    ammObjectId: string,
    outcome: number,
    amount: bigint
): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${LMSR_PACKAGE_ID}::${LMSR_CONFIG.MODULE_NAME}::sell`,
        typeArguments: [USDC_CONFIG.USDC_TYPE],
        arguments: [
            tx.object(ammObjectId),
            tx.pure.u64(outcome),
            tx.pure.u64(amount),
        ],
    });

    return tx;
};

/**
 * Interface for parsed LMSR AMM data
 */
export interface LmsrAmmData {
    id: string;
    b: bigint;           // liquidity depth parameter
    q: bigint[];         // 8 outcome quantities
    reserve: bigint;     // token reserve
}

/**
 * Parse LMSR AMM object data from Sui response
 */
export const parseLmsrAmm = (data: {
    data?: {
        content?: {
            dataType?: string;
            fields?: {
                id?: { id?: string };
                b?: string;
                q?: string[];
                reserve?: string;
            };
        };
    };
}): LmsrAmmData | null => {
    try {
        const content = data?.data?.content;
        if (!content || content.dataType !== 'moveObject') {
            return null;
        }

        const fields = content.fields;
        if (!fields) return null;

        return {
            id: fields.id?.id ?? '',
            b: BigInt(fields.b ?? '0'),
            q: (fields.q ?? []).map((v: string) => BigInt(v)),
            reserve: BigInt(fields.reserve ?? '0'),
        };
    } catch {
        return null;
    }
};

/**
 * Calculate prices from quantities using softmax (frontend simulation)
 * Matches the smart contract logic
 */
export const calculatePrices = (q: bigint[], b: bigint): number[] => {
    const scale = BigInt(LMSR_CONFIG.SCALE);
    const n = LMSR_CONFIG.OUTCOMES;

    if (b === BigInt(0)) {
        return Array(n).fill(1 / n);
    }

    const exps: number[] = [];
    let sum = 0;

    for (let i = 0; i < n; i++) {
        const qiOverB = Number(q[i]) / Number(b);
        const expVal = Math.exp(qiOverB);
        exps.push(expVal);
        sum += expVal;
    }

    return exps.map(e => e / sum);
};

/**
 * Constants
 */
export const LMSR_SCALE = BigInt(LMSR_CONFIG.SCALE);
export const LMSR_OUTCOMES = LMSR_CONFIG.OUTCOMES;
