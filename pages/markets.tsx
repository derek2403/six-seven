'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
    useSuiClientQuery,
    ConnectButton,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { getBasket, type Selection, type Outcome, ALL_CORNERS } from '../lib/market';
import { USDC_CONFIG } from '../lib/config';

// Contract addresses
const MARKET_PACKAGE = '0x3757c5b83a2d4606659e17a8130cc3022e398cb092830fe93a186171d4d2cdb8';
const MARKET_OBJECT_ID = '0xbaaada92a105f8ae69c14323ace0e003b6d14898820b916fcbdcafba87195b35';
const ENCLAVE_OBJECT_ID = '0x9c0e780d4ba223b3e5e8c8a62ba30d9b31fde3105ae6ac914587121c5855d931';

// Helper to convert hex string to bytes
function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
}

// World labels
const WORLD_LABELS = ['No,No,No', 'No,No,Yes', 'No,Yes,No', 'No,Yes,Yes', 'Yes,No,No', 'Yes,No,Yes', 'Yes,Yes,No', 'Yes,Yes,Yes'];

type Step = 'connect' | 'deposit' | 'bet' | 'submit';

export default function Markets() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // UI State
    const [currentStep, setCurrentStep] = useState<Step>('connect');
    const [worldPrices, setWorldPrices] = useState<number[]>(Array(8).fill(0.125));
    const [betAmount, setBetAmount] = useState<string>('1');
    const [depositAmount, setDepositAmount] = useState<string>('5');
    const [loading, setLoading] = useState<boolean>(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [teeResponse, setTeeResponse] = useState<any>(null);
    const [bets, setBets] = useState<any[]>([]);
    const [marketBalance, setMarketBalance] = useState<number>(0);
    const [walletBalance, setWalletBalance] = useState<number>(0);

    // Selection state (like share.tsx)
    const [selection, setSelection] = useState<Selection>({ A: 'any', B: 'any', C: 'any' });
    const basket = useMemo(() => getBasket(selection), [selection]);

    // Handler for dropdown changes
    const handleChange = (key: keyof Selection, value: Outcome) => {
        setSelection(prev => ({ ...prev, [key]: value }));
    };

    // Simplified Step Logic
    useEffect(() => {
        if (account && currentStep === 'connect') {
            setCurrentStep('bet');
        } else if (!account) {
            setCurrentStep('connect');
        }
    }, [account, currentStep]);

    // Fetch balances
    useEffect(() => {
        if (!account) return;

        const fetchBalances = async () => {
            // Get wallet USDC balance
            const balance = await suiClient.getBalance({
                owner: account.address,
                coinType: USDC_CONFIG.USDC_TYPE
            });
            setWalletBalance(parseInt(balance.totalBalance) / 1_000_000);

            // Fetch market balance from contract using devInspect
            try {
                const tx = new Transaction();
                tx.moveCall({
                    target: `${MARKET_PACKAGE}::market::get_balance`,
                    arguments: [tx.object(MARKET_OBJECT_ID), tx.pure.address(account.address)],
                });
                const result = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account.address,
                });

                if (result.results?.[0]?.returnValues?.[0]) {
                    // Navigate bytes to get u64
                    const valueBytes = result.results[0].returnValues[0][0];
                    const value = new DataView(new Uint8Array(valueBytes).buffer).getBigUint64(0, true); // Little endian
                    setMarketBalance(Number(value) / 1_000_000);
                }
            } catch (e) {
                console.error("Failed to fetch market balance", e);
            }
        };

        fetchBalances();
        const interval = setInterval(fetchBalances, 5000);
        return () => clearInterval(interval);
    }, [account, suiClient]);

    // Calculate basket price from world prices
    const basketPrice = useMemo(() => {
        return basket.corners.reduce((sum, corner) => {
            const idx = parseInt(corner, 2);
            return sum + worldPrices[idx];
        }, 0);
    }, [basket, worldPrices]);

    // STEP 1: Deposit USDC to Market
    const depositToMarket = async () => {
        if (!account) return;
        setLoading(true);
        setTxStatus(null);

        try {
            const amountMist = Math.floor(parseFloat(depositAmount) * 1_000_000); // 6 decimals

            // Get USDC coins
            const { data: coins } = await suiClient.getCoins({
                owner: account.address,
                coinType: USDC_CONFIG.USDC_TYPE,
            });

            if (coins.length === 0) {
                throw new Error("No USDC found! Mint some first.");
            }

            const tx = new Transaction();

            // Merge all coins into the first one if needed, or just pick primary
            const primaryCoin = tx.object(coins[0].coinObjectId);
            if (coins.length > 1) {
                tx.mergeCoins(primaryCoin, coins.slice(1).map(c => tx.object(c.coinObjectId)));
            }

            const [coin] = tx.splitCoins(primaryCoin, [amountMist]);

            tx.moveCall({
                target: `${MARKET_PACKAGE}::market::deposit`,
                arguments: [tx.object(MARKET_OBJECT_ID), coin],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        const txRes = await suiClient.waitForTransaction({
                            digest: result.digest,
                            options: { showEffects: true }
                        });

                        if (txRes.effects?.status.status === 'success') {
                            setTxStatus({ type: 'success', message: `Deposited ${depositAmount} USDC!` });
                            // Re-fetch balances immediately
                            const balance = await suiClient.getBalance({ owner: account.address, coinType: USDC_CONFIG.USDC_TYPE });
                            setWalletBalance(parseInt(balance.totalBalance) / 1_000_000);
                            setMarketBalance(prev => prev + parseFloat(depositAmount));
                            setCurrentStep('bet');
                        } else {
                            setTxStatus({ type: 'error', message: `Transaction failed: ${txRes.effects?.status.error || 'Unknown error'}` });
                        }
                        setLoading(false);
                    },
                    onError: (err) => {
                        setTxStatus({ type: 'error', message: err.message });
                        setLoading(false);
                    },
                }
            );
        } catch (err: any) {
            setTxStatus({ type: 'error', message: err.message });
            setLoading(false);
        }
    };

    // STEP 2 & 3: Place bet via TEE then Auto-Submit
    const placeBetAndSubmit = async () => {
        console.log("PlaceBet clicked", { account, basket, loading });
        if (!account || basket.corners.length === 0) return;

        // Check balance logic moved to render
        if (marketBalance < parseFloat(betAmount)) {
            setTxStatus({ type: 'error', message: "Insufficient market balance! Please deposit first." });
            return;
        }

        setLoading(true);
        setTxStatus(null);

        try {
            // ... (Bet Type logic same)
            const betType = basket.type === 'all' ? 'marginal' : basket.type;
            const payload: any = {
                user: account.address,
                bet_type: betType,
                amount: parseFloat(betAmount),
            };

            if (betType === 'marginal') {
                if (selection.A !== 'any') { payload.event = 0; payload.yes = selection.A === 'yes'; }
                else if (selection.B !== 'any') { payload.event = 1; payload.yes = selection.B === 'yes'; }
                else if (selection.C !== 'any') { payload.event = 2; payload.yes = selection.C === 'yes'; }
            } else if (betType === 'corner') {
                payload.world = parseInt(basket.corners[0], 2);
            } else if (betType === 'slice') {
                const conds: [number, boolean][] = [];
                if (selection.A !== 'any') conds.push([0, selection.A === 'yes']);
                if (selection.B !== 'any') conds.push([1, selection.B === 'yes']);
                if (selection.C !== 'any') conds.push([2, selection.C === 'yes']);
                payload.conditions = conds;
            }

            console.log("Sending payload:", payload);

            // 1. Call TEE
            const response = await fetch('/api/tee-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload })
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);

            if (!data.response?.data) {
                throw new Error(`TEE Error: ${JSON.stringify(data.error || 'Invalid response')}`);
            }

            const teeData = data.response;
            const newPrices = teeData.data.new_prices.map((p: number) => p / 1000000);
            setWorldPrices(newPrices);
            setTeeResponse({ ...teeData, signature: data.signature });

            // 2. Auto Submit to Chain
            await submitToChain(teeData, data.signature);

        } catch (err: any) {
            console.error("PlaceBet error:", err);
            setTxStatus({ type: 'error', message: 'Error: ' + err.message });
            setLoading(false);
        }
    };

    // Helper: Submit to chain
    const submitToChain = async (teeData: any, signatureHex: string) => {
        if (!account) return;
        setTxStatus({ type: 'success', message: "TEE Signed! Submitting to blockchain..." });

        try {
            const tx = new Transaction();
            const signatureBytes = hexToBytes(signatureHex);
            const worlds = teeData.data.worlds || [];

            tx.moveCall({
                target: `${MARKET_PACKAGE}::market::submit_bet`,
                typeArguments: [`${MARKET_PACKAGE}::market::MARKET`],
                arguments: [
                    tx.object(MARKET_OBJECT_ID),
                    tx.object(ENCLAVE_OBJECT_ID),
                    tx.pure.u64(Math.floor(parseFloat(betAmount) * 1_000_000)),
                    tx.pure.u64(teeData.data.shares),
                    tx.pure.vector('u64', teeData.data.new_prices),
                    tx.pure.string(teeData.data.commitment),
                    tx.pure.vector('u8', worlds),
                    tx.pure.u64(teeData.timestamp_ms),
                    tx.pure.vector('u8', signatureBytes),
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        const txRes = await suiClient.waitForTransaction({
                            digest: result.digest,
                            options: { showEffects: true }
                        });

                        if (txRes.effects?.status.status === 'success') {
                            setBets(prev => [{
                                selection: `${selection.A[0].toUpperCase()},${selection.B[0].toUpperCase()},${selection.C[0].toUpperCase()}`,
                                type: basket.type,
                                amount: parseFloat(betAmount),
                                shares: teeData.data.shares / 1000,
                                txDigest: result.digest,
                                timestamp: new Date().toLocaleTimeString(),
                            }, ...prev]);
                            setMarketBalance(prev => prev - parseFloat(betAmount));
                            setTeeResponse(null); // Clear TEE response
                            setTxStatus({ type: 'success', message: `Bet submitted! TX: ${result.digest.slice(0, 12)}...` });
                        } else {
                            setTxStatus({ type: 'error', message: `Transaction failed: ${txRes.effects?.status.error || 'Unknown error'}` });
                        }
                        setLoading(false);
                    },
                    onError: (err) => {
                        setTxStatus({ type: 'error', message: err.message });
                        setLoading(false);
                    },
                }
            );
        } catch (err: any) {
            setTxStatus({ type: 'error', message: err.message });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-6">
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎯 Private Prediction Market
            </h1>
            <p className="text-center text-zinc-400 mb-6">
                Deposit → Select Outcome → Bet via TEE → Submit On-Chain
            </p>

            {/* Wallet Bar */}
            <div className="flex justify-center items-center gap-4 mb-6">
                <ConnectButton />
                {account && (
                    <div className="flex gap-4">
                        <div className="bg-zinc-800 px-4 py-2 rounded-lg">
                            <span className="text-zinc-400 text-sm">Wallet: </span>
                            <span className="font-bold text-blue-400">{walletBalance.toFixed(2)} USDC</span>
                        </div>
                        <div className="bg-zinc-800 px-4 py-2 rounded-lg">
                            <span className="text-zinc-400 text-sm">Market: </span>
                            <span className="font-bold text-green-400">{marketBalance.toFixed(2)} USDC</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Left: Selection Panel */}
                <div className="bg-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Define Your Bet</h2>

                    <div className="space-y-4 mb-6">
                        {(['A', 'B', 'C'] as const).map((key, idx) => (
                            <div key={key} className="flex items-center justify-between">
                                <label className="font-medium">Event {key}</label>
                                <select
                                    value={selection[key]}
                                    onChange={(e) => handleChange(key, e.target.value as Outcome)}
                                    className="rounded-lg bg-zinc-700 border border-zinc-600 px-3 py-2 text-sm"
                                >
                                    <option value="any">Any (*)</option>
                                    <option value="yes">Yes (1)</option>
                                    <option value="no">No (0)</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-zinc-700 pt-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-zinc-400">Bet Type:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${basket.type === 'corner' ? 'bg-purple-600' :
                                basket.type === 'slice' ? 'bg-blue-600' :
                                    basket.type === 'marginal' ? 'bg-green-600' : 'bg-zinc-600'
                                }`}>{basket.type}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-zinc-400">Basket Price:</span>
                            <span className="font-bold text-yellow-400">{(basketPrice * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-zinc-500">
                            Corners: {basket.corners.join(', ') || 'All'}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {currentStep === 'connect' && (
                        <p className="text-zinc-400 text-center">Connect wallet to start</p>
                    )}

                    {currentStep === 'bet' && (
                        <div>
                            {/* Deposit Section (Visible if balance low) */}
                            {marketBalance < parseFloat(betAmount || '0') && (
                                <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                                    <h3 className="text-sm font-bold text-yellow-500 mb-2">Insufficient Market Balance</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="flex-1 bg-zinc-700 rounded-lg px-3 py-2 text-sm"
                                            placeholder="Deposit"
                                        />
                                        <button onClick={depositToMarket} disabled={loading}
                                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">
                                            {loading ? '...' : 'Deposit'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                className="w-full bg-zinc-700 rounded-lg px-4 py-3 mb-3"
                                placeholder="Bet amount (USDC)"
                            />
                            <button onClick={placeBetAndSubmit} disabled={loading || basket.corners.length === 0}
                                className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50">
                                {loading ? 'Processing Bet...' : `Bet ${betAmount} USDC on ${basket.type}`}
                            </button>
                            {loading && <p className="text-center text-xs text-zinc-400 mt-2">Checking with TEE + Processing on Chain...</p>}
                        </div>
                    )}

                    {txStatus && (
                        <p className={`mt-3 text-sm text-center ${txStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {txStatus.message}
                        </p>
                    )}
                </div>

                {/* Right: World Table */}
                <div className="bg-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">World Probabilities</h2>
                    <div className="space-y-2">
                        {ALL_CORNERS.map((corner, idx) => {
                            const isActive = basket.quantities[corner] === 1;
                            return (
                                <div key={corner} className={`flex items-center gap-3 p-2 rounded-lg ${isActive ? 'bg-purple-900/30 border border-purple-500' : 'bg-zinc-700/50'}`}>
                                    <span className="font-mono text-purple-400 w-10">{corner}</span>
                                    <span className="flex-1 text-xs text-zinc-400">{WORLD_LABELS[idx]}</span>
                                    <span className="font-bold w-16 text-right">{(worldPrices[idx] * 100).toFixed(1)}%</span>
                                    <div className="w-24 h-2 bg-zinc-600 rounded overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${worldPrices[idx] * 800}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bet History */}
            {bets.length > 0 && (
                <div className="max-w-5xl mx-auto mt-6 bg-zinc-800 rounded-xl p-4">
                    <h3 className="font-bold mb-3">📋 Your Bets</h3>
                    {bets.map((bet, idx) => (
                        <div key={idx} className="grid grid-cols-5 gap-2 bg-zinc-700/50 rounded-lg p-2 mb-2 text-sm">
                            <span className="text-zinc-400">{bet.timestamp}</span>
                            <span className="font-mono">{bet.selection}</span>
                            <span className={`capitalize ${bet.type === 'corner' ? 'text-purple-400' : bet.type === 'slice' ? 'text-blue-400' : 'text-green-400'}`}>{bet.type}</span>
                            <span>{bet.shares.toFixed(2)} shares</span>
                            <a href={`https://suiscan.xyz/testnet/tx/${bet.txDigest}`} target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                                View TX
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
