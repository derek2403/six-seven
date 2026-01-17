import { useRouter } from 'next/router';
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";
import { COMBINED_MARKETS } from "@/lib/mock/combined-markets";
import React from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PlaceBetRequest, PlaceBetResponse, PM_CONFIG } from '@/lib/tee';
import { VAULT_CONFIG, WORLD_CONFIG } from '@/lib/config';

type MarketSelection = "yes" | "no" | "any" | null;

export default function MarketPage() {
    const router = useRouter();
    const { slug } = router.query;

    // Sui Hooks
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // Backend State
    const [probabilities, setProbabilities] = React.useState<Record<string, number> | null>(null);
    const [vaultBalance, setVaultBalance] = React.useState<string>('0');
    const [maker, setMaker] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(false);

    // Initial State
    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>(
        Object.fromEntries(COMBINED_MARKETS.map(m => [m.id, true]))
    );
    const [view, setView] = React.useState("Default");

    // Fetch Pool 0 Data
    const fetchPoolData = async () => {
        try {
            // Get World Object
            const worldObj = await client.getObject({
                id: WORLD_CONFIG.WORLD_ID,
                options: { showContent: true }
            });

            const poolsTableId = worldObj.data?.content && 'fields' in worldObj.data.content
                ? (worldObj.data.content.fields as any).pools?.fields?.id?.id
                : null;

            if (!poolsTableId) return;

            // Get Pool 0 (assuming we only care about pool 0 for now as per instructions)
            // Ideally we find the pool ID from dynamic fields value... hardcoded pool ID '0' might not work directly if using object IDs as keys
            // But let's look at `world.tsx`: pool IDs are u64 keys.
            // Let's get generic dynamic field for name '0' (u64)
            const poolField = await client.getDynamicFieldObject({
                parentId: poolsTableId,
                name: { type: 'u64', value: '0' }
            });

            if (poolField.data?.content && 'fields' in poolField.data.content) {
                const poolContent = (poolField.data.content.fields as any).value.fields;

                // Fetch probs table
                const probsTableId = poolContent.probabilities?.fields?.id?.id;
                if (probsTableId) {
                    const probFields = await client.getDynamicFields({ parentId: probsTableId });
                    const newProbs: Record<string, number> = {};

                    for (const pf of probFields.data) {
                        const pItem = await client.getObject({ id: pf.objectId, options: { showContent: true } });
                        if (pItem.data?.content && 'fields' in pItem.data.content) {
                            const val = (pItem.data.content.fields as any).value;
                            // val is basis points (10000 = 100%)
                            newProbs[pf.name.value as string] = parseInt(val) / 100;
                        }
                    }
                    setProbabilities(newProbs);
                }
            }

            // Also fetch Maker for Pool 0
            fetchMakerForPool(0);

        } catch (error) {
            console.error("Error fetching pool data:", error);
        }
    };

    // Fetch maker logic from test.tsx
    const fetchMakerForPool = async (targetPoolId: number) => {
        try {
            const worldObj = await client.getObject({
                id: WORLD_CONFIG.WORLD_ID,
                options: { showContent: true }
            });
            const makerRegistryId = worldObj.data?.content && 'fields' in worldObj.data.content
                ? (worldObj.data.content.fields as any).maker_registry?.fields?.id?.id
                : null;

            if (!makerRegistryId) return;
            const fields = await client.getDynamicFields({ parentId: makerRegistryId });

            for (const field of fields.data) {
                const item = await client.getObject({ id: field.objectId, options: { showContent: true } });
                if (item.data?.content && 'fields' in item.data.content) {
                    const content = item.data.content.fields as any;
                    const poolIds = content.value as string[];
                    if (poolIds.some((pid: string) => parseInt(pid) === targetPoolId)) {
                        setMaker(field.name.value as string);
                        return;
                    }
                }
            }
        } catch (err) { console.error('Error fetching maker', err); }
    };

    // Helper to get user balance
    const getUserWithdrawableBalance = async (userAddress: string) => {
        try {
            const ledgerObj = await client.getObject({ id: VAULT_CONFIG.LEDGER_ID, options: { showContent: true } });
            const accountsTableId = ledgerObj.data?.content && 'fields' in ledgerObj.data.content
                ? (ledgerObj.data.content.fields as any).accounts?.fields?.id?.id
                : null;
            if (!accountsTableId) return BigInt(0);

            const userField = await client.getDynamicFieldObject({
                parentId: accountsTableId,
                name: { type: 'address', value: userAddress }
            });

            if (userField.data?.content && 'fields' in userField.data.content) {
                return BigInt((userField.data.content.fields as any).value.fields.withdrawable_amount);
            }
        } catch (e) { return BigInt(0); }
        return BigInt(0);
    };

    const fromHex = (hex: string) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        return Array.from(bytes);
    };

    // Trade function
    const handleTrade = async (amountStr: string, outcome: number) => {
        if (!account) {
            alert("Please connect wallet");
            return;
        }
        setIsLoading(true);
        try {
            // Get current probs (use TEE's view? No, pass current derived probs)
            // But we need array of 8 integers (basis points)
            const currentProbsArray = Array(8).fill(1250); // Default
            if (probabilities) {
                ['000', '001', '010', '011', '100', '101', '110', '111'].forEach((k, i) => {
                    if (probabilities[k] !== undefined) currentProbsArray[i] = Math.round(probabilities[k] * 100);
                });
            }

            const request: PlaceBetRequest = {
                user: account.address,
                pool_id: 0, // Hardcoded Pool 0
                outcome: outcome,
                amount: parseInt(amountStr.replace(/[^0-9]/g, "")) * 1_000_000,
                maker: maker, // Needs to be fetched
                current_probs: currentProbsArray,
            };

            const response = await fetch('/api/tee-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: 'process_data', payload: request }),
            });

            const data = await response.json();
            if (data.response?.data && data.signature) {
                const betResponse: PlaceBetResponse = data.response.data;

                // Execute Transaction
                const makerAddress = maker || account.address; // Fallback?
                const makerCurrentBalance = await getUserWithdrawableBalance(makerAddress);
                const makerNewBalance = makerCurrentBalance + BigInt(betResponse.credit_amount);

                const userCurrentBalance = await getUserWithdrawableBalance(account.address);
                const userNewBalance = userCurrentBalance - BigInt(betResponse.debit_amount);

                const tx = new Transaction();

                tx.moveCall({
                    target: `${PM_CONFIG.PM_PACKAGE}::pm::submit_bet`,
                    typeArguments: [`${PM_CONFIG.PM_PACKAGE}::pm::PM`],
                    arguments: [
                        tx.object(PM_CONFIG.ENCLAVE_OBJECT_ID),
                        tx.pure.u64(betResponse.shares),
                        tx.pure.vector('u64', betResponse.new_probs),
                        tx.pure.u64(betResponse.pool_id),
                        tx.pure.u8(betResponse.outcome),
                        tx.pure.u64(betResponse.debit_amount),
                        tx.pure.u64(betResponse.credit_amount),
                        tx.pure.u64(data.response.timestamp_ms),
                        tx.pure.vector('u8', fromHex(data.signature)),
                    ],
                });

                // Update User Balance
                tx.moveCall({
                    target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::set_withdrawable_balance`,
                    arguments: [tx.object(VAULT_CONFIG.LEDGER_ID), tx.pure.address(account.address), tx.pure.u64(userNewBalance)],
                });

                // Update Maker Balance
                tx.moveCall({
                    target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::set_withdrawable_balance`,
                    arguments: [tx.object(VAULT_CONFIG.LEDGER_ID), tx.pure.address(makerAddress), tx.pure.u64(makerNewBalance)],
                });

                // Update World Probs
                tx.moveCall({
                    target: `${WORLD_CONFIG.PACKAGE_ID}::${WORLD_CONFIG.MODULE_NAME}::update_prob`,
                    arguments: [tx.object(WORLD_CONFIG.WORLD_ID), tx.pure.u64(betResponse.pool_id), tx.pure.vector('u64', betResponse.new_probs)],
                });

                signAndExecute({ transaction: tx }, {
                    onSuccess: () => {
                        alert("Bet Placed!");
                        fetchPoolData(); // Refresh
                    },
                    onError: (e) => alert("Tx Failed: " + e.message)
                });

            } else {
                alert("TEE Error: " + JSON.stringify(data));
            }

        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPoolData();
        const interval = setInterval(fetchPoolData, 5000);
        return () => clearInterval(interval);
    }, [client]);

    // Market selections for Order Ticket (lifted state)
    const [marketSelections, setMarketSelections] = React.useState<Record<string, MarketSelection>>({
        m1: null,
        m2: null,
        m3: null,
    });

    // Focused market for line selection (only one market active at a time)
    const [focusedMarket, setFocusedMarket] = React.useState<string | null>(null);

    const toggleMarket = (id: string) => {
        setSelectedMarkets(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Auto-switch to 3D view when all 3 markets have yes/no selections
    // Auto-switch back to 2D when any market becomes "any" or null
    React.useEffect(() => {
        const m1Sel = marketSelections.m1;
        const m2Sel = marketSelections.m2;
        const m3Sel = marketSelections.m3;

        // If all 3 markets have yes or no (not null, not "any"), switch to 3D
        if (m1Sel !== null && m1Sel !== "any" &&
            m2Sel !== null && m2Sel !== "any" &&
            m3Sel !== null && m3Sel !== "any") {
            setView("3D");
        }
        // If any market is "any" or null, and we're in 3D view, switch back to 2D
        else if (view === "3D" &&
            (m1Sel === "any" || m1Sel === null ||
                m2Sel === "any" || m2Sel === null ||
                m3Sel === "any" || m3Sel === null)) {
            setView("2D");
        }
    }, [marketSelections, view]);

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Site Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <span className="text-xl font-bold tracking-tight">six-seven</span>
                        <div className="hidden md:flex space-x-6">
                            {['All', 'Sports', 'Politics', 'Crypto'].map((filter) => (
                                <span
                                    key={filter}
                                    className="font-medium cursor-pointer text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {filter}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-emerald-600 font-medium">$12.17</span>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Deposit
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 pb-16">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Left Column: All Content */}
                    <div className="flex-1 min-w-0">
                        <CombinedMarketList
                            selectedMarkets={selectedMarkets}
                            onToggleMarket={toggleMarket}
                        />

                        {/* Context Description */}
                        <div className="mt-4 px-1">
                            <p className="text-[13px] text-gray-500 leading-relaxed text-justify">
                                As of January 2026, Iran is in a state of severe internal upheaval and, to a lesser extent, external conflict following a rapid deterioration of its security and economic situation in the latter half of 2025. The context is defined by a brutal, large-scale crackdown on internal protests, economic collapse, and the aftermath of a direct, 12-day war with Israel in June 2025.
                            </p>
                        </div>

                        <div className="mt-8 text-gray-500">
                            <MarketTimeFilter
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={setView}
                            />
                        </div>

                        <div className="mt-8">
                            <MarketLegend
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={setView}
                            />
                        </div>

                        <div className="mt-4">
                            <MarketCombinedChart
                                selectedMarkets={selectedMarkets}
                                view={view}
                                marketSelections={marketSelections}
                                onMarketSelectionsChange={setMarketSelections}
                                focusedMarket={focusedMarket}
                                onFocusedMarketChange={setFocusedMarket}
                                probabilities={probabilities || undefined}
                            />
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20">
                        <TradeCard
                            marketSelections={marketSelections}
                            onMarketSelectionsChange={setMarketSelections}
                            focusedMarket={focusedMarket}
                            onTrade={handleTrade}
                        />
                        <p className="mt-4 text-center text-[13px] text-gray-400 font-medium leading-relaxed">
                            By trading, you agree to the <span className="underline cursor-pointer hover:text-gray-600 transition-colors">Terms of Use.</span>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
