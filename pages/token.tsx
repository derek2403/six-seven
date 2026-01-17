'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { USDC_CONFIG, VAULT_CONFIG, LMSR_CONFIG } from "../lib/config";
import { useState, useEffect, useMemo, useCallback } from "react";
import { formatBalance } from "../lib/format";
import { buildMint1000UsdcTransaction, USDC_COIN_TYPE } from "../lib/usdc";
import {
    parseVaultStats,
    VAULT_ID,
    type VaultStats
} from "../lib/vault";
import {
    buildCreateAmmTransaction,
    buildBuyTransaction,
    LMSR_AMM_TYPE,
    LMSR_SCALE,
    LMSR_OUTCOMES,
    parseLmsrAmm,
    type LmsrAmmData
} from "../lib/lmsr";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// ============ LMSR Types & Constants ============
const SCALE = Number(LMSR_SCALE);
const N = LMSR_OUTCOMES;

interface Market {
    id: string;          // Sui object ID of the LMSR AMM
    title: string;
    description: string;
    b: bigint;           // liquidity parameter (from chain)
    q: bigint[];         // 8 outcome quantities (from chain)
}

interface Listing {
    id: string;
    title: string;
    description: string;
    events: string[];    // 3 binary events for this listing
}

// Hardcoded listings with 3 binary events each
const LISTINGS: Listing[] = [
    {
        id: 'A',
        title: 'Title A',
        description: 'Middle East Escalation Events',
        events: ['A: Israel Strike', 'B: US Involvement', 'C: Iran Response']
    },
    {
        id: 'B',
        title: 'Title B',
        description: 'US Election 2024',
        events: ['A: Trump Wins', 'B: House Flips', 'C: Senate Flips']
    },
    {
        id: 'C',
        title: 'Title C',
        description: 'Crypto Market Events',
        events: ['A: BTC > $100K', 'B: ETH > $5K', 'C: Total MC > $5T']
    },
];

// World Table: 8 joint outcomes for 3 binary events (A, B, C)
// Each outcome represents a specific combination of Yes/No for all 3 events
const WORLD_TABLE = [
    { code: '000', meaning: 'A no, B no, C no', short: 'None happen' },
    { code: '001', meaning: 'A no, B no, C yes', short: 'Only C' },
    { code: '010', meaning: 'A no, B yes, C no', short: 'Only B' },
    { code: '011', meaning: 'A no, B yes, C yes', short: 'B & C' },
    { code: '100', meaning: 'A yes, B no, C no', short: 'Only A' },
    { code: '101', meaning: 'A yes, B no, C yes', short: 'A & C' },
    { code: '110', meaning: 'A yes, B yes, C no', short: 'A & B' },
    { code: '111', meaning: 'A yes, B yes, C yes', short: 'All happen' },
];

const OUTCOME_COLORS = [
    'bg-slate-500', 'bg-cyan-500', 'bg-amber-500', 'bg-lime-500',
    'bg-rose-500', 'bg-fuchsia-500', 'bg-violet-500', 'bg-emerald-500'
];

// ============ LMSR Math Functions (Frontend Implementation) ============
// Calculate LMSR prices using softmax (matches smart contract logic)
function calculatePrices(q: bigint[], b: bigint): number[] {
    if (b === BigInt(0)) return Array(N).fill(1 / N);

    const exps: number[] = [];
    let sum = 0;

    for (let i = 0; i < N; i++) {
        const qiOverB = Number(q[i]) / Number(b);
        const expVal = Math.exp(qiOverB);
        exps.push(expVal);
        sum += expVal;
    }

    return exps.map(e => e / sum);
}

// Calculate derived marginal probabilities from world table
function calculateMarginals(prices: number[]): { A: number; B: number; C: number } {
    // P(A=Yes) = sum of worlds where A=1: {100, 101, 110, 111} = indices {4, 5, 6, 7}
    const pA = prices[4] + prices[5] + prices[6] + prices[7];
    // P(B=Yes) = sum of worlds where B=1: {010, 011, 110, 111} = indices {2, 3, 6, 7}
    const pB = prices[2] + prices[3] + prices[6] + prices[7];
    // P(C=Yes) = sum of worlds where C=1: {001, 011, 101, 111} = indices {1, 3, 5, 7}
    const pC = prices[1] + prices[3] + prices[5] + prices[7];
    return { A: pA, B: pB, C: pC };
}

// Simulate price after buying shares of a specific outcome
function simulatePriceAfterBuy(q: bigint[], b: bigint, outcome: number, amount: bigint): number[] {
    const newQ = [...q];
    newQ[outcome] += amount;
    return calculatePrices(newQ, b);
}

export default function TokenPage() {
    return (
        <div
            className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col items-center bg-zinc-50 p-8 font-sans dark:bg-black`}
        >
            <main className="flex w-full max-w-6xl flex-col items-center gap-8">
                <h1 className="text-3xl font-bold text-black dark:text-white">
                    LMSR Prediction Market
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-center">
                    Create markets as a Maker or trade outcomes as a Taker
                </p>

                {/* LMSR Market Section */}
                <LMSRMarketSection />

                {/* Original Token Actions */}
                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-xl font-bold text-black dark:text-white mb-4">Mock USDC & Vault Testing</h2>
                    <TokenActions />
                </div>
            </main>
        </div>
    );
}

// ============ LMSR Market Component ============
function LMSRMarketSection() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [activeMarket, setActiveMarket] = useState<Market | null>(null);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [poolAmount, setPoolAmount] = useState<string>('100');
    const [isCreating, setIsCreating] = useState(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Create market from listing using smart contract
    const handleCreateMarket = useCallback(async () => {
        if (!selectedListing || !account) return;

        setIsCreating(true);
        setTxStatus(null);

        try {
            const b = BigInt(Math.floor(Number(poolAmount) * SCALE));
            const tx = buildCreateAmmTransaction(b);

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });

                        // For demo purposes, create a local market state
                        // In production, you'd query the created object ID from the transaction
                        const newMarket: Market = {
                            id: result.digest, // Use tx digest as temporary ID
                            title: selectedListing.title,
                            description: selectedListing.description,
                            b: b,
                            q: Array(N).fill(BigInt(0)),
                        };

                        setActiveMarket(newMarket);
                        setSelectedListing(null);
                        setTxStatus({
                            type: 'success',
                            message: `Market created! Tx: ${result.digest.slice(0, 16)}...`,
                        });
                        setIsCreating(false);
                    },
                    onError: (error) => {
                        setTxStatus({
                            type: 'error',
                            message: `Failed: ${error.message}`,
                        });
                        setIsCreating(false);
                    },
                }
            );
        } catch (error) {
            setTxStatus({
                type: 'error',
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
            setIsCreating(false);
        }
    }, [selectedListing, account, poolAmount, signAndExecute, suiClient]);

    // Get events for selected listing
    const selectedEvents = selectedListing?.events || LISTINGS[0].events;

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maker Section */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg dark:border-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/30">
                <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                    <span className="text-3xl">🏭</span> Maker Section
                </h2>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">
                    Select a listing and provide liquidity to create a market on-chain
                </p>

                {!account && (
                    <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm mb-4">
                        Connect your wallet to create markets
                    </div>
                )}

                {/* Listings */}
                <div className="space-y-3 mb-4">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Available Listings</h3>
                    {LISTINGS.map((listing) => (
                        <button
                            key={listing.id}
                            onClick={() => setSelectedListing(listing)}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedListing?.id === listing.id
                                ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-800/50'
                                : 'border-zinc-200 bg-white hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-emerald-600'
                                }`}
                        >
                            <div className="font-bold text-black dark:text-white">{listing.title}</div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">{listing.description}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {listing.events.map((event, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-700 text-emerald-800 dark:text-emerald-200">
                                        {event}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Pool Amount Input */}
                {selectedListing && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                                Pool Amount (Liquidity Parameter b)
                            </label>
                            <input
                                type="number"
                                value={poolAmount}
                                onChange={(e) => setPoolAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-emerald-300 bg-white text-black dark:border-emerald-700 dark:bg-zinc-800 dark:text-white"
                                placeholder="Enter pool amount..."
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Higher values = more stable prices, lower values = more volatile
                            </p>
                        </div>
                        <button
                            onClick={handleCreateMarket}
                            disabled={isCreating || !account}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Creating Market...' : 'Create Market with 8 Outcomes (On-Chain)'}
                        </button>
                    </div>
                )}

                {/* Transaction Status */}
                {txStatus && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${txStatus.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {txStatus.message}
                    </div>
                )}

                {/* Active Market Display */}
                {activeMarket && (
                    <div className="mt-4 p-4 rounded-lg bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-700">
                        <div className="text-sm text-emerald-600 dark:text-emerald-400">Active Market (On-Chain)</div>
                        <div className="font-bold text-black dark:text-white">{activeMarket.title}</div>
                        <div className="text-sm text-zinc-500">Pool: {(Number(activeMarket.b) / SCALE).toLocaleString()} USDC</div>
                        <div className="text-xs text-zinc-400 font-mono mt-1 truncate">ID: {activeMarket.id}</div>
                    </div>
                )}
            </div>

            {/* Taker Section */}
            <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-lg dark:border-violet-800 dark:from-violet-900/30 dark:to-purple-900/30">
                <h2 className="text-2xl font-bold text-violet-800 dark:text-violet-300 mb-4 flex items-center gap-2">
                    <span className="text-3xl">📊</span> Taker Section
                </h2>
                <p className="text-sm text-violet-600 dark:text-violet-400 mb-4">
                    Buy shares and watch prices adjust in real-time
                </p>

                {activeMarket ? (
                    <TakerPanel market={activeMarket} setMarket={setActiveMarket} events={selectedEvents} />
                ) : (
                    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                        <div className="text-4xl mb-3">⏳</div>
                        <p>Create a market first to start trading</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============ Taker Panel Component ============
function TakerPanel({ market, setMarket, events }: { market: Market; setMarket: (m: Market) => void; events: string[] }) {
    const [buyAmount, setBuyAmount] = useState<string>('10');
    const [hoveredOutcome, setHoveredOutcome] = useState<number | null>(null);

    // Current prices (0-1 floats representing probabilities)
    const currentPrices = useMemo(() => calculatePrices(market.q, market.b), [market.q, market.b]);

    // Derived marginal probabilities
    const marginals = useMemo(() => calculateMarginals(currentPrices), [currentPrices]);

    // Simulated prices after hover
    const simulatedPrices = useMemo(() => {
        if (hoveredOutcome === null) return null;
        const amount = BigInt(Math.floor(Number(buyAmount) * SCALE));
        return simulatePriceAfterBuy(market.q, market.b, hoveredOutcome, amount);
    }, [market.q, market.b, hoveredOutcome, buyAmount]);

    // Handle buy (local simulation - in production would call smart contract)
    const handleBuy = (outcome: number) => {
        const amount = BigInt(Math.floor(Number(buyAmount) * SCALE));
        const newQ = [...market.q];
        newQ[outcome] += amount;
        setMarket({ ...market, q: newQ });
    };

    // Format price as percentage
    const formatPrice = (price: number): string => {
        return (price * 100).toFixed(2) + '%';
    };

    // Calculate price change
    const getPriceChange = (index: number): { value: number; direction: 'up' | 'down' | 'neutral' } => {
        if (!simulatedPrices) return { value: 0, direction: 'neutral' };
        const change = (simulatedPrices[index] - currentPrices[index]) * 100;
        return {
            value: Math.abs(change),
            direction: change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'neutral'
        };
    };

    return (
        <div className="space-y-4">
            {/* Derived Marginal Probabilities */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <div className="text-center">
                    <div className="text-xs text-violet-600 dark:text-violet-400">{events[0]?.split(':')[0] || 'A'}</div>
                    <div className="font-bold text-violet-800 dark:text-violet-200">{formatPrice(marginals.A)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-violet-600 dark:text-violet-400">{events[1]?.split(':')[0] || 'B'}</div>
                    <div className="font-bold text-violet-800 dark:text-violet-200">{formatPrice(marginals.B)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-violet-600 dark:text-violet-400">{events[2]?.split(':')[0] || 'C'}</div>
                    <div className="font-bold text-violet-800 dark:text-violet-200">{formatPrice(marginals.C)}</div>
                </div>
            </div>

            {/* Buy Amount Input */}
            <div>
                <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-1">
                    Buy Amount (shares)
                </label>
                <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-violet-300 bg-white text-black dark:border-violet-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Enter amount..."
                />
            </div>

            {/* 8 Outcome Price Visualization (World Table) */}
            <div className="space-y-2">
                <h3 className="font-semibold text-violet-700 dark:text-violet-300">
                    World Table (8 Joint Outcomes) - Click to Buy
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {WORLD_TABLE.map((world, index) => {
                        const priceChange = getPriceChange(index);
                        const isHovered = hoveredOutcome === index;

                        return (
                            <button
                                key={index}
                                onMouseEnter={() => setHoveredOutcome(index)}
                                onMouseLeave={() => setHoveredOutcome(null)}
                                onClick={() => handleBuy(index)}
                                className={`relative p-3 rounded-lg border-2 text-left transition-all ${isHovered
                                    ? 'border-violet-500 scale-105 shadow-lg'
                                    : 'border-zinc-200 dark:border-zinc-700'
                                    } bg-white dark:bg-zinc-800`}
                            >
                                {/* Color indicator */}
                                <div className={`absolute top-0 left-0 w-2 h-full rounded-l-lg ${OUTCOME_COLORS[index]}`} />

                                <div className="ml-3">
                                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{world.code}</div>
                                    <div className="font-medium text-sm text-black dark:text-white">{world.short}</div>
                                    <div className="text-lg font-bold text-violet-700 dark:text-violet-300">
                                        {formatPrice(currentPrices[index])}
                                    </div>

                                    {/* Price change preview */}
                                    {isHovered && priceChange.direction !== 'neutral' && (
                                        <div className={`text-xs font-medium ${priceChange.direction === 'up'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {priceChange.direction === 'up' ? '↑' : '↓'} {priceChange.value.toFixed(2)}%
                                        </div>
                                    )}

                                    {/* Quantity display */}
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Shares: {(Number(market.q[index]) / SCALE).toFixed(0)}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Price Sum Verification */}
            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Sum of all probabilities: {(currentPrices.reduce((a, b) => a + b, 0) * 100).toFixed(2)}%
            </div>

            {/* Price Chart Visualization */}
            <div className="mt-4 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Price Distribution</h4>
                <div className="flex items-end gap-1 h-24">
                    {currentPrices.map((price, index) => {
                        const height = price * 100;
                        const isHovered = hoveredOutcome === index;
                        return (
                            <div
                                key={index}
                                className={`flex-1 rounded-t transition-all ${OUTCOME_COLORS[index]} ${isHovered ? 'opacity-100' : 'opacity-70'
                                    }`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                                title={`${WORLD_TABLE[index].code}: ${formatPrice(price)}`}
                            />
                        );
                    })}
                </div>
                <div className="flex gap-1 mt-1">
                    {WORLD_TABLE.map((world, index) => (
                        <div key={index} className="flex-1 text-center text-[10px] text-zinc-500 font-mono">
                            {world.code}
                        </div>
                    ))}
                </div>
            </div>
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
