'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { WORLD_CONFIG } from "../lib/config";
import { useState, useEffect } from "react";
import { formatBalance, parseAmount } from "../lib/format";
import { buildCreatePoolTransaction, buildProvideLiquidityTransaction, buildUpdateProbTransaction } from "../lib/world";
import { VaultControls } from "../components/VaultControls";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function WorldPage() {
    const [createdPools, setCreatedPools] = useState<Record<string, string>>({});

    const handlePoolCreated = (poolId: string, digest: string) => {
        setCreatedPools(prev => ({ ...prev, [poolId]: digest }));
    };

    return (
        <div
            className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col items-center bg-zinc-50 p-8 font-sans dark:bg-black`}
        >
            <main className="flex w-full max-w-6xl flex-col items-center gap-8">
                {/* Video Section at Top */}
                <div className="w-full rounded-xl overflow-hidden border border-zinc-200 shadow-lg dark:border-zinc-800">
                    <video
                        src="/nautilus.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-auto"
                        style={{ display: 'block' }}
                    />
                </div>

                <div className="flex w-full items-center justify-between">
                    <h1 className="text-3xl font-bold text-black dark:text-white">
                        World Prediction Market
                    </h1>
                    <VaultControls />
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 text-center">
                    Create pools, provide liquidity, and manage prediction markets.
                </p>

                <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="flex flex-col gap-8">
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <CreatePoolForm onPoolCreated={handlePoolCreated} />
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <ProvideLiquidityForm />
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <WorldTable createdPools={createdPools} />
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <MakerTable />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function CreatePoolForm({ onPoolCreated }: { onPoolCreated: (poolId: string, digest: string) => void }) {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [resolveAt, setResolveAt] = useState('');

    const handleCreatePool = async () => {
        if (!account) return;

        setIsLoading(true);
        setStatus(null);

        try {
            // Default resolve time to 1 day from now if not set
            const resolveTimeMs = resolveAt ? new Date(resolveAt).getTime() : Date.now() + 86400000;

            const tx = buildCreatePoolTransaction(title, imageUrl, description, resolveTimeMs);

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });

                        // Fetch the new Pool ID
                        let poolIdMessage = "";
                        try {
                            const worldObj = await suiClient.getObject({
                                id: WORLD_CONFIG.WORLD_ID,
                                options: { showContent: true }
                            });

                            const makerRegistryId = worldObj.data?.content && 'fields' in worldObj.data.content
                                ? (worldObj.data.content.fields as any).maker_registry?.fields?.id?.id
                                : null;

                            if (makerRegistryId) {
                                const makerField = await suiClient.getDynamicFieldObject({
                                    parentId: makerRegistryId,
                                    name: {
                                        type: 'address',
                                        value: account.address
                                    }
                                });

                                if (makerField.data?.content && 'fields' in makerField.data.content) {
                                    const userPools = (makerField.data.content.fields as any).value;
                                    if (Array.isArray(userPools) && userPools.length > 0) {
                                        const newPoolId = userPools[userPools.length - 1];
                                        poolIdMessage = ` ID: ${newPoolId}`;
                                        onPoolCreated(newPoolId, result.digest);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Failed to fetch new pool ID", err);
                        }

                        setStatus({ type: 'success', message: `Pool created!${poolIdMessage} Tx: ${result.digest}` });
                        setTitle('');
                        setImageUrl('');
                        setDescription('');
                        setResolveAt('');
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

    if (!account) {
        return <div className="text-center text-zinc-500">Connect wallet to create pools</div>;
    }

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">
                Create New Pool
            </h3>
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Pool Title"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <input
                    type="datetime-local"
                    value={resolveAt}
                    onChange={(e) => setResolveAt(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <button
                    onClick={handleCreatePool}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? 'Creating...' : 'Create Pool'}
                </button>
                {status && (
                    <div className={`rounded p-2 text-xs break-all ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProvideLiquidityForm() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [poolId, setPoolId] = useState('');
    const [amount, setAmount] = useState('');

    const handleProvideLiquidity = async () => {
        if (!account || !poolId || !amount) return;

        const parsedAmount = parseAmount(amount);
        if (parsedAmount <= BigInt(0)) {
            setStatus({ type: 'error', message: 'Invalid amount' });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            const tx = buildProvideLiquidityTransaction(poolId, parsedAmount);

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setStatus({ type: 'success', message: `Liquidity provided! Tx: ${result.digest}` });
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
                Provide Liquidity
            </h3>
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    value={poolId}
                    onChange={(e) => setPoolId(e.target.value)}
                    placeholder="Pool ID"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount (USDC)"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <button
                    onClick={handleProvideLiquidity}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                    {isLoading ? 'Providing...' : 'Provide Liquidity'}
                </button>
                {status && (
                    <div className={`rounded p-2 text-xs break-all ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

interface PoolData {
    id: string;
    title: string;
    liquidity: string;
    shares: Record<string, string>;
    probabilities: Record<string, string>;
}

function WorldTable({ createdPools }: { createdPools: Record<string, string> }) {
    const suiClient = useSuiClient();
    const [pools, setPools] = useState<PoolData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPools = async () => {
        setIsLoading(true);
        try {
            // 1. Get World Object to find pools table ID
            const worldObj = await suiClient.getObject({
                id: WORLD_CONFIG.WORLD_ID,
                options: { showContent: true }
            });

            const poolsTableId = worldObj.data?.content && 'fields' in worldObj.data.content
                ? (worldObj.data.content.fields as any).pools?.fields?.id?.id
                : null;

            if (!poolsTableId) return;

            // 2. Get Dynamic Fields (Pools)
            const fields = await suiClient.getDynamicFields({
                parentId: poolsTableId,
            });

            // 3. Fetch pool details
            const poolPromises = fields.data.map(async (field) => {
                const item = await suiClient.getObject({
                    id: field.objectId,
                    options: { showContent: true }
                });

                if (item.data?.content && 'fields' in item.data.content) {
                    const content = item.data.content.fields as any;
                    const poolValue = content.value?.fields;

                    // Fetch shares and probabilities tables
                    const sharesTableId = poolValue.shares?.fields?.id?.id;
                    const probsTableId = poolValue.probabilities?.fields?.id?.id;

                    let shares: Record<string, string> = {};
                    let probs: Record<string, string> = {};

                    if (sharesTableId) {
                        const shareFields = await suiClient.getDynamicFields({ parentId: sharesTableId });
                        for (const sf of shareFields.data) {
                            const sItem = await suiClient.getObject({ id: sf.objectId, options: { showContent: true } });
                            if (sItem.data?.content && 'fields' in sItem.data.content) {
                                const sContent = sItem.data.content.fields as any;
                                shares[sf.name.value as string] = sContent.value;
                            }
                        }
                    }

                    if (probsTableId) {
                        const probFields = await suiClient.getDynamicFields({ parentId: probsTableId });
                        for (const pf of probFields.data) {
                            const pItem = await suiClient.getObject({ id: pf.objectId, options: { showContent: true } });
                            if (pItem.data?.content && 'fields' in pItem.data.content) {
                                const pContent = pItem.data.content.fields as any;
                                probs[pf.name.value as string] = pContent.value;
                            }
                        }
                    }

                    return {
                        id: poolValue.id,
                        title: poolValue.title,
                        liquidity: poolValue.liquidity,
                        shares,
                        probabilities: probs
                    };
                }
                return null;
            });

            const results = await Promise.all(poolPromises);
            setPools(results.filter((p): p is NonNullable<typeof p> => p !== null));

        } catch (error) {
            console.error("Failed to fetch pools", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPools();
        const interval = setInterval(fetchPools, 10000);
        return () => clearInterval(interval);
    }, [suiClient]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                    🌍 World Pools
                </h3>
                <button
                    onClick={fetchPools}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                    Refresh
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {isLoading && pools.length === 0 ? (
                    <div className="text-center text-zinc-500">Loading pools...</div>
                ) : pools.length === 0 ? (
                    <div className="text-center text-zinc-500">No pools found</div>
                ) : (
                    pools.map((pool) => (
                        <div key={pool.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                            <div className="mb-2 flex items-center justify-between">
                                <h4 className="font-semibold text-black dark:text-white">
                                    #{pool.id} - {pool.title}
                                </h4>
                                <span className="text-xs text-zinc-500">
                                    Liq: {formatBalance(pool.liquidity)}
                                </span>
                            </div>
                            {createdPools[pool.id] && (
                                <div className="mb-2 text-[10px] text-green-600">
                                    Created in Tx: <a href={`https://suiscan.xyz/tx/${createdPools[pool.id]}`} target="_blank" rel="noreferrer" className="underline">{createdPools[pool.id].slice(0, 10)}...</a>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-zinc-500">
                                            <th className="pb-1">World</th>
                                            <th className="pb-1 text-right">Prob</th>
                                            <th className="pb-1 text-right">Shares</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
                                        {['000', '001', '010', '011', '100', '101', '110', '111'].map((outcome, idx) => (
                                            <tr key={outcome}>
                                                <td className="py-1 font-mono text-zinc-600 dark:text-zinc-400">{outcome}</td>
                                                <td className="py-1 text-right text-zinc-900 dark:text-zinc-100">
                                                    {pool.probabilities[idx] ? (parseInt(pool.probabilities[idx]) / 10000).toFixed(2) : '0.00'}
                                                </td>
                                                <td className="py-1 text-right text-zinc-900 dark:text-zinc-100">
                                                    {pool.shares[idx] ? formatBalance(pool.shares[idx]) : '0.00'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <UpdateProbForm poolId={pool.id} currentProbs={pool.probabilities} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function UpdateProbForm({ poolId, currentProbs }: { poolId: string, currentProbs: Record<string, string> }) {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isExpanded, setIsExpanded] = useState(false);
    const [probs, setProbs] = useState<string[]>(Array(8).fill('0.12'));
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Initialize probs from current state when expanded
    useEffect(() => {
        if (isExpanded) {
            const newProbs = Array(8).fill('0');
            for (let i = 0; i < 8; i++) {
                newProbs[i] = currentProbs[i] ? (parseInt(currentProbs[i]) / 10000).toString() : '0.12';
            }
            setProbs(newProbs);
        }
    }, [isExpanded, currentProbs]);

    const handleUpdate = async () => {
        if (!account) return;
        setIsLoading(true);
        setStatus(null);

        try {
            const scaledProbs = probs.map(p => Math.round(parseFloat(p) * 10000));
            const tx = buildUpdateProbTransaction(poolId, scaledProbs);

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setStatus({ type: 'success', message: 'Updated!' });
                        setIsLoading(false);
                        setIsExpanded(false);
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

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="mt-2 w-full rounded border border-zinc-200 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
                Update Probabilities
            </button>
        );
    }

    return (
        <div className="mt-2 rounded bg-zinc-100 p-2 dark:bg-zinc-900">
            <div className="grid grid-cols-4 gap-2">
                {probs.map((p, i) => (
                    <div key={i}>
                        <label className="text-[10px] text-zinc-500">{['000', '001', '010', '011', '100', '101', '110', '111'][i]}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={p}
                            onChange={(e) => {
                                const newProbs = [...probs];
                                newProbs[i] = e.target.value;
                                setProbs(newProbs);
                            }}
                            className="w-full rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                        />
                    </div>
                ))}
            </div>
            <div className="mt-2 flex gap-2">
                <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="flex-1 rounded bg-blue-600 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? 'Updating...' : 'Save'}
                </button>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                    Cancel
                </button>
            </div>
            {status && (
                <div className={`mt-1 text-[10px] ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
}

interface MakerData {
    address: string;
    poolIds: string[];
}

function MakerTable() {
    const suiClient = useSuiClient();
    const [makers, setMakers] = useState<MakerData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMakers = async () => {
        setIsLoading(true);
        try {
            const worldObj = await suiClient.getObject({
                id: WORLD_CONFIG.WORLD_ID,
                options: { showContent: true }
            });

            const makerRegistryId = worldObj.data?.content && 'fields' in worldObj.data.content
                ? (worldObj.data.content.fields as any).maker_registry?.fields?.id?.id
                : null;

            if (!makerRegistryId) return;

            const fields = await suiClient.getDynamicFields({
                parentId: makerRegistryId,
            });

            const makerPromises = fields.data.map(async (field) => {
                const item = await suiClient.getObject({
                    id: field.objectId,
                    options: { showContent: true }
                });

                if (item.data?.content && 'fields' in item.data.content) {
                    const content = item.data.content.fields as any;
                    // Key is address, Value is vector<u64> (pool IDs)
                    return {
                        address: field.name.value as string,
                        poolIds: content.value as string[]
                    };
                }
                return null;
            });

            const results = await Promise.all(makerPromises);
            setMakers(results.filter((m): m is NonNullable<typeof m> => m !== null));

        } catch (error) {
            console.error("Failed to fetch makers", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMakers();
        const interval = setInterval(fetchMakers, 10000);
        return () => clearInterval(interval);
    }, [suiClient]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                    👥 Maker Registry
                </h3>
                <button
                    onClick={fetchMakers}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                    Refresh
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {isLoading && makers.length === 0 ? (
                    <div className="text-center text-zinc-500">Loading makers...</div>
                ) : makers.length === 0 ? (
                    <div className="text-center text-zinc-500">No makers found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-zinc-500">
                                    <th className="pb-2">Maker Address</th>
                                    <th className="pb-2 text-right">Pools</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
                                {makers.map((maker) => (
                                    <tr key={maker.address}>
                                        <td className="py-2 font-mono text-zinc-600 dark:text-zinc-400">
                                            {maker.address.slice(0, 6)}...{maker.address.slice(-4)}
                                        </td>
                                        <td className="py-2 text-right text-zinc-900 dark:text-zinc-100">
                                            {maker.poolIds.length}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
