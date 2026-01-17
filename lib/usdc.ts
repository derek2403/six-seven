import { Transaction } from '@mysten/sui/transactions';
import { USDC_CONFIG } from './config';

/**
 * Build a transaction to mint 1000 USDC to the caller
 * @returns Transaction object ready to be signed and executed
 */
export const buildMint1000UsdcTransaction = (): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${USDC_CONFIG.PACKAGE_ID}::${USDC_CONFIG.MODULE_NAME}::mint_1000_usdc`,
        arguments: [
            tx.object(USDC_CONFIG.TREASURY_CAP_ID),
        ],
    });

    return tx;
};

/**
 * USDC coin type for queries
 */
export const USDC_COIN_TYPE = USDC_CONFIG.USDC_TYPE;
