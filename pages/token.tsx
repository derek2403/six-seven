'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { USDC_CONFIG, VAULT_CONFIG } from "../lib/config";
import { useState, useEffect } from "react";
import { formatBalance, parseAmount } from "../lib/format";
import { buildMint1000UsdcTransaction, USDC_COIN_TYPE } from "../lib/usdc";
import {
    parseVaultStats,
    VAULT_ID,
    LEDGER_ID,
    buildSetWithdrawableBalanceTransaction,
    type VaultStats
} from "../lib/vault";
import { VaultControls } from "../components/VaultControls";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function TokenPage() {
    return (
        <div
            className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black`}
        >
            <main className="flex w-full max-w-4xl flex-col items-center gap-8">
                <div className="flex w-full items-center justify-between">
                    <h1 className="text-3xl font-bold text-black dark:text-white">
                        Mock USDC &amp; Vault Testing
                    </h1>
                    <VaultControls />
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 text-center">
                    Test minting USDC tokens. Use the header controls to Deposit/Withdraw.
                </p>

                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <TokenActions />
                </div>

                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <AdminActions />
                </div>

                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <AllUsersTable />
                </div>
            </main>
        </div>
    );
}

// Component for token minting and vault stats
function TokenActions() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [vaultStats, setVaultStats] = useState<VaultStats | null>(null);

    // Query USDC balance for the connected wallet
    const { data: balanceData, refetch: refetchBalance } = useSuiClientQuery(
        'getBalance',
        {
            owner: account?.address ?? '',
            coinType: USDC_COIN_TYPE,
        },
        {
            enabled: !!account?.address,
        }
    );

    // Query vault object to get balance
    const { data: vaultData, refetch: refetchVault } = useSuiClientQuery(
        'getObject',
        {
            id: VAULT_ID,
            options: {
                showContent: true,
            },
        },
        {
            enabled: true,
        }
    );

    // Query ledger object to get stats
    const { data: ledgerData, refetch: refetchLedger } = useSuiClientQuery(
        'getObject',
        {
            id: LEDGER_ID,
            options: {
                showContent: true,
            },
        },
        {
            enabled: true,
        }
    );

    // Parse vault stats when vault data changes
    useEffect(() => {
        const stats = parseVaultStats(
            vaultData as Parameters<typeof parseVaultStats>[0],
            ledgerData as Parameters<typeof parseVaultStats>[1]
        );
        setVaultStats(stats);
    }, [vaultData, ledgerData]);

    // Refetch all data
    const refetchAll = async () => {
        await Promise.all([refetchBalance(), refetchVault(), refetchLedger()]);
    };

    // Mint 1000 USDC to the connected wallet
    const handleMint1000USDC = async () => {
        if (!account) return;

        setIsLoading(true);
        setTxStatus(null);

        try {
            const tx = buildMint1000UsdcTransaction();

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setTxStatus({
                            type: 'success',
                            message: `Successfully minted 1000 USDC! Tx: ${result.digest}`,
                        });
                        await refetchAll();
                        setIsLoading(false);
                    },
                    onError: (error) => {
                        setTxStatus({
                            type: 'error',
                            message: `Failed to mint: ${error.message}`,
                        });
                        setIsLoading(false);
                    },
                }
            );
        } catch (error) {
            setTxStatus({
                type: 'error',
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
            setIsLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="mt-6 text-center text-zinc-500 dark:text-zinc-400">
                Please connect your wallet to test the token functions
            </div>
        );
    }

    return (
        <div className="mt-8 flex flex-col gap-6">
            {/* Wallet Address */}
            <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Connected Wallet</div>
                <div className="mt-1 font-mono text-sm text-black dark:text-white break-all">
                    {account.address}
                </div>
            </div>

            {/* USDC Balance */}
            <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Wallet USDC Balance</div>
                <div className="mt-1 text-2xl font-bold text-black dark:text-white">
                    {balanceData ? formatBalance(balanceData.totalBalance) : '0.000000'} USDC
                </div>
            </div>

            {/* Mint Section */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                    🪙 Mint USDC
                </h3>
                <button
                    onClick={handleMint1000USDC}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? 'Processing...' : 'Mint 1000 USDC'}
                </button>
            </div>

            {/* Vault Stats */}
            <div className="rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 p-4 dark:from-purple-900/30 dark:to-indigo-900/30">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">
                    🏦 Vault Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Balance</div>
                        <div className="text-lg font-bold text-black dark:text-white">
                            {vaultStats ? formatBalance(vaultStats.balance) : '0.000000'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Deposited</div>
                        <div className="text-lg font-bold text-black dark:text-white">
                            {vaultStats ? formatBalance(vaultStats.deposited) : '0.000000'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">Net Active</div>
                        <div className="text-lg font-bold text-black dark:text-white">
                            {vaultStats ? formatBalance(vaultStats.withdrawable) : '0.000000'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Status */}
            {txStatus && (
                <div
                    className={`rounded-lg p-4 ${txStatus.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                >
                    <div className="text-sm font-medium">
                        {txStatus.type === 'success' ? '✓ Success' : '✗ Error'}
                    </div>
                    <div className="mt-1 text-sm break-all">{txStatus.message}</div>
                </div>
            )}

            {/* Contract Info */}
            <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Contract Info
                </div>
                <div className="space-y-2 text-xs">
                    <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Package ID: </span>
                        <a
                            href={`https://suiscan.xyz/testnet/object/${USDC_CONFIG.PACKAGE_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                            {USDC_CONFIG.PACKAGE_ID}
                        </a>
                    </div>
                    <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Vault: </span>
                        <a
                            href={`https://suiscan.xyz/testnet/object/${VAULT_CONFIG.VAULT_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                            {VAULT_CONFIG.VAULT_ID}
                        </a>
                    </div>
                    <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Ledger: </span>
                        <a
                            href={`https://suiscan.xyz/testnet/object/${VAULT_CONFIG.LEDGER_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                            {VAULT_CONFIG.LEDGER_ID}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminActions() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [targetAddress, setTargetAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleUpdateBalance = async () => {
        if (!account || !targetAddress || !amount) return;

        const parsedAmount = parseAmount(amount);
        if (parsedAmount < 0) { // Allow 0
            setStatus({ type: 'error', message: 'Invalid amount' });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            const tx = buildSetWithdrawableBalanceTransaction(targetAddress, parsedAmount);
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setStatus({ type: 'success', message: 'Balance updated successfully!' });
                        setAmount('');
                        setIsLoading(false);
                    },
                    onError: (error) => {
                        setStatus({ type: 'error', message: error.message });
                        setIsLoading(false);
                    }
                }
            );
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
            setIsLoading(false);
        }
    };

    if (!account) return null;

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">
                🔧 Admin: Modify User Balance
            </h3>
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    placeholder="Target User Address"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="New Withdrawable Amount (USDC)"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <button
                    onClick={handleUpdateBalance}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-zinc-800 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50"
                >
                    {isLoading ? 'Updating...' : 'Set Balance'}
                </button>
                {status && (
                    <div className={`rounded p-2 text-xs ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

function AllUsersTable() {
    const suiClient = useSuiClient();
    const [users, setUsers] = useState<Array<{ address: string; deposited: string; withdrawable: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // 1. Get Ledger Object to find accounts table ID
            const ledgerObj = await suiClient.getObject({
                id: LEDGER_ID,
                options: { showContent: true }
            });

            const accountsTableId = ledgerObj.data?.content && 'fields' in ledgerObj.data.content
                ? (ledgerObj.data.content.fields as any).accounts?.fields?.id?.id
                : null;

            if (!accountsTableId) return;

            // 2. Get Dynamic Fields of the table
            // Note: This only fetches the first page. For production, implement pagination.
            const fields = await suiClient.getDynamicFields({
                parentId: accountsTableId,
            });

            // 3. Fetch object data for each field to get values
            const userPromises = fields.data.map(async (field) => {
                const item = await suiClient.getObject({
                    id: field.objectId,
                    options: { showContent: true }
                });

                if (item.data?.content && 'fields' in item.data.content) {
                    const content = item.data.content.fields as any;
                    // Table stores Key -> Value. The value is inside the 'value' field of the dynamic field object
                    const value = content.value?.fields;
                    return {
                        address: field.name.value as string,
                        deposited: value?.deposited_amount || '0',
                        withdrawable: value?.withdrawable_amount || '0'
                    };
                }
                return null;
            });

            const results = await Promise.all(userPromises);
            setUsers(results.filter((u): u is NonNullable<typeof u> => u !== null));

        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [suiClient]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                    👥 All Users (Ledger)
                </h3>
                <button
                    onClick={fetchUsers}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 dark:border-zinc-700">
                        <tr>
                            <th className="px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">Address</th>
                            <th className="px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">Deposited</th>
                            <th className="px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">Withdrawable</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {isLoading && users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-zinc-500">Loading...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-zinc-500">No users found</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.address} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-4 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                                        {user.address}
                                    </td>
                                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">
                                        {formatBalance(user.deposited)}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-green-600 dark:text-green-400">
                                        {formatBalance(user.withdrawable)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
