import { Transaction } from '@mysten/sui/transactions';
import { VAULT_CONFIG } from './config';

/**
 * Coin data structure from Sui client
 */
export interface CoinData {
    coinObjectId: string;
    balance: string;
}

/**
 * Vault statistics parsed from the vault object
 */
export interface VaultStats {
    balance: string;
    deposited: string;
    withdrawable: string;
}

/**
 * Parse vault stats from vault object data
 * @param vaultData - Raw vault data from Sui client
 * @returns Parsed vault statistics or null if invalid
 */
export const parseVaultStats = (vaultData: {
    data?: {
        content?: {
            fields?: {
                balance?: string;
                total_deposited?: string;
                total_withdrawn?: string;
            };
        };
    };
} | null): VaultStats | null => {
    if (vaultData?.data?.content && 'fields' in vaultData.data.content) {
        const fields = vaultData.data.content.fields as {
            balance: string;
            total_deposited: string;
            total_withdrawn: string;
        };
        return {
            balance: fields.balance || '0',
            deposited: fields.total_deposited || '0',
            withdrawable: String(BigInt(fields.total_deposited || '0') - BigInt(fields.total_withdrawn || '0')),
        };
    }
    return null;
};

/**
 * Build a transaction to deposit USDC into the vault
 * @param coins - Array of USDC coin objects from the wallet
 * @param amountToDeposit - Amount to deposit in smallest units
 * @returns Transaction object ready to be signed and executed, or null if no coins
 */
export const buildDepositTransaction = (
    coins: CoinData[],
    amountToDeposit: bigint
): Transaction | null => {
    if (coins.length === 0) {
        return null;
    }

    const tx = new Transaction();

    // If we have multiple coins, merge them first
    let coinToUse;
    if (coins.length === 1) {
        coinToUse = tx.object(coins[0].coinObjectId);
    } else {
        // Merge all coins into the first one
        const [firstCoin, ...restCoins] = coins;
        coinToUse = tx.object(firstCoin.coinObjectId);
        if (restCoins.length > 0) {
            tx.mergeCoins(
                coinToUse,
                restCoins.map(c => tx.object(c.coinObjectId))
            );
        }
    }

    // Split the exact amount we want to deposit
    const [depositCoin] = tx.splitCoins(coinToUse, [tx.pure.u64(amountToDeposit)]);

    tx.moveCall({
        target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::deposit`,
        arguments: [
            tx.object(VAULT_CONFIG.VAULT_ID),
            depositCoin,
        ],
    });

    return tx;
};

/**
 * Build a transaction to withdraw USDC from the vault
 * @param amountToWithdraw - Amount to withdraw in smallest units
 * @returns Transaction object ready to be signed and executed
 */
export const buildWithdrawTransaction = (amountToWithdraw: bigint): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::withdraw`,
        arguments: [
            tx.object(VAULT_CONFIG.VAULT_ID),
            tx.pure.u64(amountToWithdraw),
        ],
    });

    return tx;
};

/**
 * Build a transaction to withdraw all USDC from the vault
 * @returns Transaction object ready to be signed and executed
 */
export const buildWithdrawAllTransaction = (): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::withdraw_all`,
        arguments: [
            tx.object(VAULT_CONFIG.VAULT_ID),
        ],
    });

    return tx;
};

/**
 * Vault object ID for queries
 */
export const VAULT_ID = VAULT_CONFIG.VAULT_ID;
