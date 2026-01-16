'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { USDC_CONFIG } from "../lib/config";
import { useState } from "react";

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
            <main className="flex w-full max-w-3xl flex-col items-center gap-8">
                <h1 className="text-3xl font-bold text-black dark:text-white">
                    Mock USDC Token
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-center">
                    Test your mock USDC token by minting tokens to your wallet
                </p>

                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <ConnectButton />
                    <TokenActions />
                </div>
            </main>
        </div>
    );
}

// Component for token minting actions
function TokenActions() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Query USDC balance for the connected wallet
    const { data: balanceData, refetch: refetchBalance } = useSuiClientQuery(
        'getBalance',
        {
            owner: account?.address ?? '',
            coinType: USDC_CONFIG.USDC_TYPE,
        },
        {
            enabled: !!account?.address,
        }
    );

    // Format balance with decimals
    const formatBalance = (balance: string) => {
        const num = BigInt(balance);
        const decimals = BigInt(10 ** USDC_CONFIG.DECIMALS);
        const whole = num / decimals;
        const fraction = num % decimals;
        return `${whole}.${fraction.toString().padStart(USDC_CONFIG.DECIMALS, '0')}`;
    };

    // Mint 1000 USDC to the connected wallet
    const handleMint1000USDC = async () => {
        if (!account) return;

        setIsLoading(true);
        setTxStatus(null);

        try {
            const tx = new Transaction();

            tx.moveCall({
                target: `${USDC_CONFIG.PACKAGE_ID}::${USDC_CONFIG.MODULE_NAME}::mint_1000_usdc`,
                arguments: [
                    tx.object(USDC_CONFIG.TREASURY_CAP_ID),
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        // Wait for transaction to be confirmed
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setTxStatus({
                            type: 'success',
                            message: `Successfully minted 1000 USDC! Tx: ${result.digest}`,
                        });
                        // Refetch balance after successful mint
                        refetchBalance();
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
                Please connect your wallet to mint USDC tokens
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
                <div className="text-sm text-zinc-500 dark:text-zinc-400">USDC Balance</div>
                <div className="mt-1 text-2xl font-bold text-black dark:text-white">
                    {balanceData ? formatBalance(balanceData.totalBalance) : '0.000000'} USDC
                </div>
            </div>

            {/* Mint Button */}
            <button
                onClick={handleMint1000USDC}
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Minting...
                    </span>
                ) : (
                    'Mint 1000 USDC'
                )}
            </button>

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
                </div>
            </div>
        </div>
    );
}
