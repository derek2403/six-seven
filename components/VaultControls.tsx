'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { formatBalance, parseAmount } from '../lib/format';
import {
    buildDepositTransaction,
    buildWithdrawTransaction,
    buildWithdrawAllTransaction,
    parseUserAccountData,
    VAULT_ID,
    LEDGER_ID,
    type CoinData
} from '../lib/vault';
import { USDC_COIN_TYPE } from '../lib/usdc';

export function VaultControls() {
    const account = useCurrentAccount();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!account) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <VaultTrigger isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    <VaultActions onClose={() => setIsOpen(false)} />
                </div>
            )}
        </div>
    );
}

function VaultTrigger({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
    const account = useCurrentAccount();

    // 1. Get Ledger Object to find the accounts table ID
    const { data: ledgerData } = useSuiClientQuery(
        'getObject',
        { id: LEDGER_ID, options: { showContent: true } }
    );

    // Extract accounts table ID
    const accountsTableId = ledgerData?.data?.content && 'fields' in ledgerData.data.content
        ? (ledgerData.data.content.fields as any).accounts?.fields?.id?.id
        : null;

    // 2. Query the user's account from the table using Dynamic Field
    const { data: userAccountData } = useSuiClientQuery(
        'getDynamicFieldObject',
        {
            parentId: accountsTableId || '',
            name: {
                type: 'address',
                value: account?.address || '',
            }
        },
        {
            enabled: !!accountsTableId && !!account?.address,
            refetchInterval: 5000
        }
    );

    const userStats = parseUserAccountData(userAccountData);
    const balance = userStats ? formatBalance(userStats.withdrawable_amount) : '0.00';

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${isOpen
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
        >
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Balance:</div>
            <div className="font-bold text-black dark:text-white">{balance} USDC</div>
            <svg
                className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );
}

function VaultActions({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // Queries
    const { data: coinsData, refetch: refetchCoins } = useSuiClientQuery(
        'getCoins',
        { owner: account?.address ?? '', coinType: USDC_COIN_TYPE },
        { enabled: !!account }
    );

    const { data: balanceData } = useSuiClientQuery(
        'getBalance',
        { owner: account?.address ?? '', coinType: USDC_COIN_TYPE },
        { enabled: !!account }
    );

    // Also fetch user vault balance for the withdraw tab
    // Use LEDGER_ID for accounts table
    const { data: ledgerData } = useSuiClientQuery(
        'getObject',
        { id: LEDGER_ID, options: { showContent: true } }
    );
    const accountsTableId = ledgerData?.data?.content && 'fields' in ledgerData.data.content
        ? (ledgerData.data.content.fields as any).accounts?.fields?.id?.id
        : null;
    const { data: userAccountData, refetch: refetchUserVault } = useSuiClientQuery(
        'getDynamicFieldObject',
        {
            parentId: accountsTableId || '',
            name: { type: 'address', value: account?.address || '' }
        },
        { enabled: !!accountsTableId && !!account?.address }
    );
    const userStats = parseUserAccountData(userAccountData);

    const handleAction = async () => {
        if (!account) return;

        const parsedAmount = parseAmount(amount);
        if (parsedAmount <= 0) {
            setStatus({ type: 'error', message: 'Invalid amount' });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            let tx: Transaction | null = null;

            if (activeTab === 'deposit') {
                if (!coinsData?.data) throw new Error('No coin data');
                const coins: CoinData[] = coinsData.data.map(c => ({
                    coinObjectId: c.coinObjectId,
                    balance: c.balance,
                }));
                tx = buildDepositTransaction(coins, parsedAmount);
                if (!tx) throw new Error('No USDC coins found');
            } else {
                tx = buildWithdrawTransaction(parsedAmount);
            }

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setStatus({ type: 'success', message: 'Transaction successful!' });
                        setAmount('');
                        await Promise.all([refetchCoins(), refetchUserVault()]);
                        // Close after short delay on success
                        setTimeout(onClose, 1500);
                    },
                    onError: (error) => {
                        setStatus({ type: 'error', message: error.message });
                    }
                }
            );
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawAll = async () => {
        setIsLoading(true);
        setStatus(null);
        try {
            const tx = buildWithdrawAllTransaction();
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setStatus({ type: 'success', message: 'Withdrew all funds!' });
                        await refetchUserVault();
                        setTimeout(onClose, 1500);
                    },
                    onError: (error) => setStatus({ type: 'error', message: error.message })
                }
            );
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to build transaction' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                {(['deposit', 'withdraw'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setStatus(null); }}
                        className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${activeTab === tab
                            ? 'bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {activeTab === 'deposit' ? (
                        <>Wallet Balance: {balanceData ? formatBalance(balanceData.totalBalance) : '0'} USDC</>
                    ) : (
                        <>Available to Withdraw: {userStats ? formatBalance(userStats.withdrawable_amount) : '0'} USDC</>
                    )}
                </div>

                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />

                <button
                    onClick={handleAction}
                    disabled={isLoading}
                    className={`w-full rounded-lg py-2 text-sm font-semibold text-white transition-colors ${activeTab === 'deposit'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                        } disabled:opacity-50`}
                >
                    {isLoading ? 'Processing...' : activeTab === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>

                {activeTab === 'withdraw' && (
                    <button
                        onClick={handleWithdrawAll}
                        disabled={isLoading}
                        className="text-xs text-orange-600 hover:underline dark:text-orange-400"
                    >
                        Withdraw All
                    </button>
                )}

                {status && (
                    <div className={`rounded p-2 text-xs ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}
