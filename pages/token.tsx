'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { USDC_CONFIG, VAULT_CONFIG } from "../lib/config";
import { useState, useEffect } from "react";
import { formatBalance } from "../lib/format";
import { buildMint1000UsdcTransaction, USDC_COIN_TYPE } from "../lib/usdc";
import {
    parseVaultStats,
    VAULT_ID,
    type VaultStats
} from "../lib/vault";

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
                <h1 className="text-3xl font-bold text-black dark:text-white">
                    Mock USDC &amp; Vault Testing
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-center">
                    Test minting USDC tokens. Use the header controls to Deposit/Withdraw.
                </p>

                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <TokenActions />
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

    // Query vault object to get user's vault info
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

    // Parse vault stats when vault data changes
    useEffect(() => {
        const stats = parseVaultStats(vaultData as Parameters<typeof parseVaultStats>[0]);
        setVaultStats(stats);
    }, [vaultData]);

    // Refetch all data
    const refetchAll = async () => {
        await Promise.all([refetchBalance(), refetchVault()]);
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
                        <span className="text-zinc-500 dark:text-zinc-400">Treasury Cap: </span>
                        <a
                            href={`https://suiscan.xyz/testnet/object/${USDC_CONFIG.TREASURY_CAP_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                            {USDC_CONFIG.TREASURY_CAP_ID}
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
                </div>
            </div>
        </div>
    );
}
