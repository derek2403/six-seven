import { Transaction } from '@mysten/sui/transactions';
import { SuiObjectResponse } from '@mysten/sui/client';
import { VAULT_CONFIG } from './config';

/**
 * Coin data structure from Sui client
 */
export interface CoinData {
    coinObjectId: string;
    balance: string;
}

/**
 * Vault statistics parsed from the ledger object (Global stats)
 */
export interface VaultStats {
    balance: string; // From Vault object
    deposited: string; // From Ledger object
    withdrawable: string; // From Ledger object
}

/**
 * User Account data parsed from the ledger's accounts table
 */
export interface UserAccountData {
    deposited_amount: string;
    withdrawable_amount: string;
}

/**
 * Parse vault stats from vault and ledger object data
 * @param vaultData - Raw vault data from Sui client
 * @param ledgerData - Raw ledger data from Sui client
 * @returns Parsed vault statistics or null if invalid
 */
export const parseVaultStats = (
    vaultData: SuiObjectResponse | null | undefined,
    ledgerData: SuiObjectResponse | null | undefined
): VaultStats | null => {
    let balance = '0';
    let deposited = '0';
    let withdrawn = '0';

    if (vaultData?.data?.content?.dataType === 'moveObject' && 'fields' in vaultData.data.content) {
        const fields = vaultData.data.content.fields as {
            balance: string;
        };
        balance = fields.balance || '0';
    }

    if (ledgerData?.data?.content?.dataType === 'moveObject' && 'fields' in ledgerData.data.content) {
        const fields = ledgerData.data.content.fields as {
            total_deposited: string;
            total_withdrawn: string;
        };
        deposited = fields.total_deposited || '0';
        withdrawn = fields.total_withdrawn || '0';
    }

    return {
        balance,
        deposited,
        withdrawable: String(BigInt(deposited) - BigInt(withdrawn)),
    };
};

/**
 * Parse user account data from the dynamic field object
 * @param accountData - Raw account data from Sui client
 * @returns Parsed user account data or null if invalid
 */
export const parseUserAccountData = (accountData: SuiObjectResponse | null | undefined): UserAccountData | null => {
    if (accountData?.data?.content?.dataType === 'moveObject' && 'fields' in accountData.data.content) {
        // The table stores values, so we look for the value field
        // Structure: DynamicField { name: address, value: UserAccount { ... } }
        const fields = accountData.data.content.fields as {
            value?: {
                fields?: {
                    deposited_amount: string;
                    withdrawable_amount: string;
                }
            }
        };

        if (fields.value?.fields) {
            return {
                deposited_amount: fields.value.fields.deposited_amount || '0',
                withdrawable_amount: fields.value.fields.withdrawable_amount || '0',
            };
        }
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
            tx.object(VAULT_CONFIG.LEDGER_ID),
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
            tx.object(VAULT_CONFIG.LEDGER_ID),
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
            tx.object(VAULT_CONFIG.LEDGER_ID),
        ],
    });

    return tx;
};

/**
 * Build a transaction to set a user's withdrawable balance (Admin/Debug)
 * @param userAddress - Address of the user
 * @param newAmount - New withdrawable amount
 * @returns Transaction object
 */
export const buildSetWithdrawableBalanceTransaction = (userAddress: string, newAmount: bigint): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::set_withdrawable_balance`,
        arguments: [
            tx.object(VAULT_CONFIG.LEDGER_ID),
            tx.pure.address(userAddress),
            tx.pure.u64(newAmount),
        ],
    });

    return tx;
};

/**
 * Vault and Ledger object IDs for queries
 */
export const VAULT_ID = VAULT_CONFIG.VAULT_ID;
export const LEDGER_ID = VAULT_CONFIG.LEDGER_ID;
