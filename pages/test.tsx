// Integration Test Page - Test full user flow with TEE and Smart Contracts
import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PlaceBetRequest, PlaceBetResponse, ResolveRequest, ResolveResponse } from '../lib/tee';
import { PM_CONFIG } from '../lib/pm';
import { VAULT_CONFIG, WORLD_CONFIG, USDC_CONFIG } from '../lib/config';
import { buildMint1000UsdcTransaction, USDC_COIN_TYPE } from '../lib/usdc';
import { buildDepositTransaction, CoinData, parseUserAccountData } from '../lib/vault';

export default function TestPage() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // State
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [userBalance, setUserBalance] = useState<string>('0');
    const [vaultBalance, setVaultBalance] = useState<string>('0');
    const [worldData, setWorldData] = useState<any>(null);
    const [pools, setPools] = useState<any[]>([]);

    // Test inputs
    const [poolId, setPoolId] = useState('0');
    const [outcome, setOutcome] = useState('0');
    const [betAmount, setBetAmount] = useState('10');
    const [maker, setMaker] = useState('');

    const log = (msg: string) => {
        console.log(msg);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    // Fetch user data
    const fetchUserData = async () => {
        if (!account) return;

        try {
            // Get USDC coins in wallet
            const coins = await client.getCoins({
                owner: account.address,
                coinType: USDC_CONFIG.USDC_TYPE,
            });
            const walletBalance = coins.data.reduce((sum, c) => sum + BigInt(c.balance), BigInt(0));
            log(`Wallet USDC: ${(Number(walletBalance) / 1_000_000).toFixed(2)}`);

            // Get vault balance (via dynamic field)
            const ledgerFields = await client.getDynamicFields({
                parentId: VAULT_CONFIG.LEDGER_ID,
            });
            const userField = ledgerFields.data.find(f =>
                (f.name as any).value === account.address
            );
            if (userField) {
                const fieldObj = await client.getObject({
                    id: userField.objectId,
                    options: { showContent: true },
                });
                const userData = parseUserAccountData(fieldObj);
                if (userData) {
                    setVaultBalance(userData.withdrawable_amount);
                    log(`Vault Balance: ${(Number(userData.withdrawable_amount) / 1_000_000).toFixed(2)} USDC`);
                }
            } else {
                setVaultBalance('0');
                log('No vault account found');
            }

            // Get World data and pools
            const worldObj = await client.getObject({
                id: WORLD_CONFIG.WORLD_ID,
                options: { showContent: true },
            });
            if (worldObj.data?.content?.dataType === 'moveObject') {
                const fields = (worldObj.data.content as any).fields;
                setWorldData(fields);
                log(`World has ${fields.pool_count} pools`);

                // Fetch pool details from dynamic fields
                try {
                    const poolFields = await client.getDynamicFields({
                        parentId: fields.pools.fields.id.id,
                    });
                    const poolDetails = await Promise.all(
                        poolFields.data.map(async (pf: any) => {
                            const poolObj = await client.getObject({
                                id: pf.objectId,
                                options: { showContent: true },
                            });
                            if (poolObj.data?.content?.dataType === 'moveObject') {
                                return (poolObj.data.content as any).fields.value?.fields || null;
                            }
                            return null;
                        })
                    );
                    setPools(poolDetails.filter(Boolean));
                } catch (e) {
                    log('Could not fetch pool details');
                }
            }
        } catch (err: any) {
            log(`Error fetching data: ${err.message}`);
        }
    };

    useEffect(() => {
        if (account) {
            fetchUserData();
            setMaker(account.address); // Default maker to current user for testing
        }
    }, [account]);

    // Test 1: Mint USDC
    const testMintUsdc = async () => {
        if (!account) return;
        setLoading(true);
        log('--- TEST: Mint 1000 USDC ---');

        try {
            const tx = buildMint1000UsdcTransaction();
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        log(`✅ Minted 1000 USDC! TX: ${result.digest}`);
                        fetchUserData();
                    },
                    onError: (err) => log(`❌ Mint failed: ${err.message}`),
                }
            );
        } catch (err: any) {
            log(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test 2: Deposit to Vault
    const testDeposit = async () => {
        if (!account) return;
        setLoading(true);
        log('--- TEST: Deposit to Vault ---');

        try {
            const coins = await client.getCoins({
                owner: account.address,
                coinType: USDC_CONFIG.USDC_TYPE,
            });
            const coinData: CoinData[] = coins.data.map(c => ({
                coinObjectId: c.coinObjectId,
                balance: c.balance,
            }));

            const amount = BigInt(100 * 1_000_000); // 100 USDC
            const tx = buildDepositTransaction(coinData, amount);
            if (!tx) {
                log('❌ No USDC coins available');
                return;
            }

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        log(`✅ Deposited 100 USDC! TX: ${result.digest}`);
                        fetchUserData();
                    },
                    onError: (err) => log(`❌ Deposit failed: ${err.message}`),
                }
            );
        } catch (err: any) {
            log(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test 3: Call TEE /process_data
    const testPlaceBet = async () => {
        if (!account) return;
        setLoading(true);
        log('--- TEST: Place Bet via TEE ---');

        try {
            // Get current probs from World (or use default)
            const currentProbs = [1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250]; // 12.5% each

            const request: PlaceBetRequest = {
                user: account.address,
                pool_id: parseInt(poolId),
                outcome: parseInt(outcome),
                amount: parseInt(betAmount) * 1_000_000, // Convert to smallest unit
                maker: maker,
                current_probs: currentProbs,
            };

            log(`Sending to TEE: ${JSON.stringify(request)}`);

            const response = await fetch('/api/tee-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: 'process_data',
                    payload: request,
                }),
            });

            const data = await response.json();
            log(`TEE Response: ${JSON.stringify(data, null, 2)}`);

            if (data.response?.data && data.signature) {
                const betResponse: PlaceBetResponse = data.response.data;
                log(`✅ TEE calculated: ${betResponse.shares} shares`);
                log(`New probs: [${betResponse.new_probs.map(p => (p / 100).toFixed(1) + '%').join(', ')}]`);

                // Check if signature is present
                log(`Signature: ${data.signature.slice(0, 10)}...`);

                // Now execute PM contract call with signature
                log('Executing PM contract submission...');
                await executePMSubmitBet(betResponse, data.response.timestamp_ms, data.signature);
            } else {
                log(`❌ TEE Error or missing signature: ${JSON.stringify(data.error || data)}`);
            }
        } catch (err: any) {
            log(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fromHex = (hex: string) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return Array.from(bytes);
    };

    // Execute PM contract submission
    const executePMSubmitBet = async (betResponse: PlaceBetResponse, timestamp: number, signature: string) => {
        if (!account) return;

        const tx = new Transaction();

        // Call pm::submit_bet
        tx.moveCall({
            target: `${PM_CONFIG.PM_PACKAGE}::pm::submit_bet`,
            typeArguments: [`${PM_CONFIG.PM_PACKAGE}::pm::PM`],
            arguments: [
                tx.object(PM_CONFIG.ENCLAVE_OBJECT_ID), // The registered enclave object
                // Response data
                tx.pure.u64(betResponse.shares),
                tx.pure.vector('u64', betResponse.new_probs),
                tx.pure.u64(betResponse.pool_id),
                tx.pure.u8(betResponse.outcome),
                tx.pure.u64(betResponse.debit_amount),
                tx.pure.u64(betResponse.credit_amount),
                // Signature
                tx.pure.u64(timestamp),
                tx.pure.vector('u8', fromHex(signature)),
            ],
        });

        signAndExecute(
            { transaction: tx },
            {
                onSuccess: (result) => {
                    log(`✅ PM contract confirmed! Signature Verified. TX: ${result.digest}`);
                    fetchUserData();
                },
                onError: (err) => log(`❌ PM submission failed: ${err.message}`),
            }
        );
    };

    // Test 4: TEE Health Check (via proxy to avoid CORS)
    const testTeeHealth = async () => {
        setLoading(true);
        log('--- TEST: TEE Health Check ---');

        try {
            // Try direct first, then proxy
            const response = await fetch('/api/tee-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: 'health_check', payload: {} }),
            });
            const data = await response.json();
            if (data.pk) {
                log(`TEE PK: ${data.pk.slice(0, 20)}...`);
                log(`✅ TEE is reachable`);
            } else {
                log(`TEE Response: ${JSON.stringify(data)}`);
                log(`✅ TEE is reachable (via proxy)`);
            }
        } catch (err: any) {
            log(`❌ TEE unreachable: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test 5: Resolve Market
    const testResolve = async () => {
        setLoading(true);
        log('--- TEST: Resolve Market ---');

        try {
            const request: ResolveRequest = {
                pool_id: parseInt(poolId),
                winning_outcome: parseInt(outcome),
            };

            log(`Sending resolve request: ${JSON.stringify(request)}`);

            const response = await fetch('/api/tee-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: 'resolve',
                    payload: request,
                }),
            });

            const data = await response.json();
            log(`Resolve Response: ${JSON.stringify(data, null, 2)}`);

            if (data.response?.data) {
                const resolveResponse: ResolveResponse = data.response.data;
                log(`✅ Market resolved! ${resolveResponse.payouts.length} winners`);
                log(`Total payout: ${(resolveResponse.total_payout / 1_000_000).toFixed(2)} USDC`);
            }
        } catch (err: any) {
            log(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">🧪 Integration Test Page</h1>

            {/* Connection Status */}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Connection</h2>
                {account ? (
                    <div>
                        <p className="text-green-400">✅ Connected: {account.address.slice(0, 10)}...</p>
                        <p className="text-zinc-400">Vault Balance: {(Number(vaultBalance) / 1_000_000).toFixed(2)} USDC</p>
                    </div>
                ) : (
                    <p className="text-red-400">❌ Wallet not connected</p>
                )}
            </div>

            {/* Test Inputs */}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Test Inputs</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400">Pool ID</label>
                        <input
                            type="number"
                            value={poolId}
                            onChange={(e) => setPoolId(e.target.value)}
                            className="w-full bg-zinc-700 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400">Outcome (0-7)</label>
                        <input
                            type="number"
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            className="w-full bg-zinc-700 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400">Bet Amount (USDC)</label>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="w-full bg-zinc-700 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400">Maker Address</label>
                        <input
                            type="text"
                            value={maker}
                            onChange={(e) => setMaker(e.target.value)}
                            className="w-full bg-zinc-700 rounded px-3 py-2 text-xs"
                            placeholder="0x..."
                        />
                    </div>
                </div>
            </div>

            {/* Test Buttons */}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Tests</h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={testTeeHealth}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        1. TEE Health
                    </button>
                    <button
                        onClick={testMintUsdc}
                        disabled={loading || !account}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        2. Mint 1000 USDC
                    </button>
                    <button
                        onClick={testDeposit}
                        disabled={loading || !account}
                        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        3. Deposit 100 USDC
                    </button>
                    <button
                        onClick={testPlaceBet}
                        disabled={loading || !account}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        4. Place Bet
                    </button>
                    <button
                        onClick={testResolve}
                        disabled={loading || !account}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        5. Resolve Market
                    </button>
                    <button
                        onClick={fetchUserData}
                        disabled={loading || !account}
                        className="bg-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => setLogs([])}
                        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-semibold"
                    >
                        Clear Logs
                    </button>
                </div>
            </div>

            {/* Pool Details */}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Markets/Pools ({pools.length})</h2>
                {pools.length === 0 ? (
                    <p className="text-zinc-500">No pools found. Click Refresh to load.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pools.map((pool, idx) => (
                            <div key={idx} className="bg-zinc-700 p-3 rounded-lg">
                                <div className="font-bold text-lg mb-1">{pool.title || `Pool ${pool.id}`}</div>
                                <div className="text-sm text-zinc-400 mb-2">{pool.description}</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-zinc-400">ID:</span> {pool.id}</div>
                                    <div><span className="text-zinc-400">Liquidity:</span> {(Number(pool.liquidity || 0) / 1_000_000).toFixed(2)}</div>
                                    <div><span className="text-zinc-400">Volume:</span> {(Number(pool.volume || 0) / 1_000_000).toFixed(2)}</div>
                                    <div><span className="text-zinc-400">Created:</span> {new Date(Number(pool.created_at)).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Contract IDs */}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Contract IDs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                    <div><span className="text-zinc-400">TEE:</span> {PM_CONFIG.TEE_URL}</div>
                    <div><span className="text-zinc-400">Vault:</span> {VAULT_CONFIG.VAULT_ID.slice(0, 20)}...</div>
                    <div><span className="text-zinc-400">Ledger:</span> {VAULT_CONFIG.LEDGER_ID.slice(0, 20)}...</div>
                    <div><span className="text-zinc-400">World:</span> {WORLD_CONFIG.WORLD_ID.slice(0, 20)}...</div>
                </div>
            </div>

            {/* Logs */}
            <div className="p-4 bg-black rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Logs</h2>
                <div className="h-96 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <p className="text-zinc-500">No logs yet. Click a test button to start.</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-zinc-300'}`}>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
