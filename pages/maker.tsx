'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import { formatBalance, parseAmount } from '../lib/format';
import { buildProvideLiquidityTransaction } from '../lib/world';
import {
    buildDepositTransaction,
    parseUserAccountData,
    LEDGER_ID,
    type CoinData
} from '../lib/vault';
import { USDC_COIN_TYPE } from '../lib/usdc';
import { VAULT_CONFIG, WORLD_CONFIG } from '../lib/config';
import Link from 'next/link';

export default function MakerPage() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // Step tracking
    const [currentStep, setCurrentStep] = useState<'connect' | 'terms' | 'deposit' | 'liquidity'>('connect');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Deposit state
    const [depositAmount, setDepositAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);
    const [depositStatus, setDepositStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Liquidity state
    const [poolId, setPoolId] = useState('');
    const [liquidityAmount, setLiquidityAmount] = useState('');
    const [isProvidingLiquidity, setIsProvidingLiquidity] = useState(false);
    const [liquidityStatus, setLiquidityStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Queries
    const { data: coinsData, refetch: refetchCoins } = useSuiClientQuery(
        'getCoins',
        { owner: account?.address ?? '', coinType: USDC_COIN_TYPE },
        { enabled: !!account }
    );

    const { data: balanceData, refetch: refetchBalance } = useSuiClientQuery(
        'getBalance',
        { owner: account?.address ?? '', coinType: USDC_COIN_TYPE },
        { enabled: !!account }
    );

    // Get user's vault balance
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
        { enabled: !!accountsTableId && !!account?.address, refetchInterval: 5000 }
    );
    const userStats = parseUserAccountData(userAccountData);

    // Update step based on wallet connection and terms
    useEffect(() => {
        if (!account) {
            setCurrentStep('connect');
        } else if (!termsAccepted) {
            setCurrentStep('terms');
        } else {
            setCurrentStep('deposit');
        }
    }, [account, termsAccepted]);

    // Handle deposit
    const handleDeposit = async () => {
        if (!account || !depositAmount) return;

        const parsedAmount = parseAmount(depositAmount);
        if (parsedAmount <= 0) {
            setDepositStatus({ type: 'error', message: 'Invalid amount' });
            return;
        }

        setIsDepositing(true);
        setDepositStatus(null);

        try {
            if (!coinsData?.data) throw new Error('No coin data');
            const coins: CoinData[] = coinsData.data.map(c => ({
                coinObjectId: c.coinObjectId,
                balance: c.balance,
            }));

            const tx = buildDepositTransaction(coins, parsedAmount);
            if (!tx) throw new Error('No USDC coins found in wallet');

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setDepositStatus({ type: 'success', message: `Deposited ${depositAmount} USDC successfully!` });
                        setDepositAmount('');
                        await Promise.all([refetchCoins(), refetchBalance(), refetchUserVault()]);
                        setIsDepositing(false);
                    },
                    onError: (error) => {
                        setDepositStatus({ type: 'error', message: error.message });
                        setIsDepositing(false);
                    }
                }
            );
        } catch (error) {
            setDepositStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
            setIsDepositing(false);
        }
    };

    // Handle liquidity provision
    const handleProvideLiquidity = async () => {
        if (!account || !poolId || !liquidityAmount) return;

        const parsedAmount = parseAmount(liquidityAmount);
        if (parsedAmount <= 0) {
            setLiquidityStatus({ type: 'error', message: 'Invalid amount' });
            return;
        }

        // Check if user has enough vault balance
        const userBalance = userStats ? BigInt(userStats.withdrawable_amount) : BigInt(0);
        if (parsedAmount > userBalance) {
            setLiquidityStatus({ type: 'error', message: 'Insufficient vault balance. Please deposit more USDC first.' });
            return;
        }

        setIsProvidingLiquidity(true);
        setLiquidityStatus(null);

        try {
            const tx = buildProvideLiquidityTransaction(poolId, parsedAmount);

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setLiquidityStatus({ type: 'success', message: `Successfully provided ${liquidityAmount} USDC liquidity to Pool ${poolId}!` });
                        setPoolId('');
                        setLiquidityAmount('');
                        await refetchUserVault();
                        setIsProvidingLiquidity(false);
                    },
                    onError: (error) => {
                        setLiquidityStatus({ type: 'error', message: error.message });
                        setIsProvidingLiquidity(false);
                    }
                }
            );
        } catch (error) {
            setLiquidityStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
            setIsProvidingLiquidity(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Phōcast
                        </span>
                        <span className="text-sm font-medium text-slate-500">Market Maker</span>
                    </Link>
                    <ConnectButton />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12">
                    <div className="flex items-center gap-3">
                        {['Connect', 'Terms', 'Deposit', 'Liquidity'].map((step, idx) => {
                            const stepKeys = ['connect', 'terms', 'deposit', 'liquidity'];
                            const currentIdx = stepKeys.indexOf(currentStep);
                            const isCompleted = idx < currentIdx;
                            const isCurrent = stepKeys[idx] === currentStep;
                            return (
                                <React.Fragment key={step}>
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${isCurrent
                                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                        : isCompleted
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    {idx < 3 && (
                                        <div className={`w-12 h-1 rounded ${idx < currentIdx ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Step 1: Connect Wallet */}
                {currentStep === 'connect' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">Connect Your Wallet</h2>
                        <p className="text-slate-600 mb-6">
                            Connect your Sui wallet to become a market maker on Phōcast.
                        </p>
                        <ConnectButton />
                    </div>
                )}

                {/* Step 2: Accept Terms */}
                {currentStep === 'terms' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Market Maker Agreement</h2>

                        <div className="bg-slate-50 rounded-xl p-6 mb-6 max-h-64 overflow-y-auto text-sm text-slate-600 leading-relaxed">
                            <h3 className="font-bold text-slate-800 mb-3">Terms and Conditions</h3>
                            <p className="mb-3">
                                By becoming a market maker on Phōcast, you agree to the following:
                            </p>
                            <ul className="list-disc list-inside space-y-2 mb-4">
                                <li><strong>Liquidity Provision:</strong> You will provide liquidity to prediction markets, enabling other users to trade efficiently.</li>
                                <li><strong>Risk Acknowledgment:</strong> Market making involves risk. You may lose some or all of your deposited funds if market conditions move against your positions.</li>
                                <li><strong>No Guarantees:</strong> There are no guaranteed returns. Earnings depend on market activity and spread capture.</li>
                                <li><strong>Capital Requirements:</strong> Ensure you have sufficient capital to cover potential losses and maintain positions.</li>
                                <li><strong>Compliance:</strong> You are responsible for complying with all applicable laws and regulations in your jurisdiction.</li>
                            </ul>
                            <h3 className="font-bold text-slate-800 mb-3">Rewards Program</h3>
                            <p className="mb-3">
                                Market makers are eligible for liquidity rewards based on:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Amount of liquidity provided</li>
                                <li>Duration of liquidity provision</li>
                                <li>Market activity and volume</li>
                            </ul>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                                I have read and agree to the Market Maker Agreement. I understand the risks involved and confirm that I am eligible to participate.
                            </span>
                        </label>

                        <button
                            onClick={() => setCurrentStep('deposit')}
                            disabled={!termsAccepted}
                            className="w-full mt-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            Accept & Continue
                        </button>
                    </div>
                )}

                {/* Step 3: Deposit to Vault */}
                {currentStep === 'deposit' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Deposit to Vault</h2>
                            <p className="text-slate-600 mb-6">
                                Deposit USDC to your Phōcast vault to use as liquidity.
                            </p>

                            {/* Balances */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-sm text-slate-500 mb-1">Wallet Balance</div>
                                    <div className="text-xl font-bold text-slate-800">
                                        {balanceData ? formatBalance(balanceData.totalBalance) : '0.00'} USDC
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4">
                                    <div className="text-sm text-emerald-600 mb-1">Vault Balance</div>
                                    <div className="text-xl font-bold text-emerald-700">
                                        {userStats ? formatBalance(userStats.withdrawable_amount) : '0.00'} USDC
                                    </div>
                                </div>
                            </div>

                            {/* Deposit Input */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount (USDC)</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Enter amount to deposit"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleDeposit}
                                    disabled={isDepositing || !depositAmount}
                                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                    {isDepositing ? 'Depositing...' : 'Deposit USDC'}
                                </button>

                                {depositStatus && (
                                    <div className={`p-4 rounded-xl text-sm ${depositStatus.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-red-50 text-red-800'
                                        }`}>
                                        {depositStatus.message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={() => setCurrentStep('liquidity')}
                            className="w-full py-3 rounded-xl border-2 border-emerald-600 text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
                        >
                            Continue to Provide Liquidity →
                        </button>
                    </div>
                )}

                {/* Step 4: Provide Liquidity */}
                {currentStep === 'liquidity' && (
                    <div className="space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={() => setCurrentStep('deposit')}
                            className="text-slate-600 hover:text-slate-800 flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Deposit
                        </button>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Provide Liquidity</h2>
                            <p className="text-slate-600 mb-6">
                                Add liquidity to a prediction market pool.
                            </p>

                            {/* Vault Balance */}
                            <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                                <div className="text-sm text-emerald-600 mb-1">Available Vault Balance</div>
                                <div className="text-xl font-bold text-emerald-700">
                                    {userStats ? formatBalance(userStats.withdrawable_amount) : '0.00'} USDC
                                </div>
                            </div>

                            {/* Liquidity Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Pool ID</label>
                                    <input
                                        type="text"
                                        value={poolId}
                                        onChange={(e) => setPoolId(e.target.value)}
                                        placeholder="Enter Pool ID"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount (USDC)</label>
                                    <input
                                        type="number"
                                        value={liquidityAmount}
                                        onChange={(e) => setLiquidityAmount(e.target.value)}
                                        placeholder="Enter amount to provide"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleProvideLiquidity}
                                    disabled={isProvidingLiquidity || !poolId || !liquidityAmount}
                                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                    {isProvidingLiquidity ? 'Providing Liquidity...' : 'Provide Liquidity'}
                                </button>

                                {liquidityStatus && (
                                    <div className={`p-4 rounded-xl text-sm ${liquidityStatus.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-red-50 text-red-800'
                                        }`}>
                                        {liquidityStatus.message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ How it works</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Your liquidity enables trades in the market</li>
                                <li>• Earn rewards proportional to your liquidity share</li>
                                <li>• Funds are locked until market resolution</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Connected Wallet Info - Removed as per user request */}
            </main>
        </div>
    );
}
