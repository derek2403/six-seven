import { useRouter } from 'next/router';
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";
import { WalletConnect } from "@/components/WalletConnect";
import { COMBINED_MARKETS, DEFAULT_MARKET_DATA } from "@/lib/mock/combined-markets";
import React from 'react';
import { useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { PlaceBetRequest, PlaceBetResponse, PM_CONFIG } from '@/lib/tee';
import { VAULT_CONFIG, WORLD_CONFIG } from '@/lib/config';
import type { BuildSponsoredBetTxRequest, BuildSponsoredTxResponse } from '@/lib/shinami-types';

type MarketSelection = "yes" | "no" | "any" | null;

export default function MarketPage() {
    const router = useRouter();
    const { slug } = router.query;

    // Sui Hooks
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutateAsync: signTransaction } = useSignTransaction();

    // Backend State
    const [probabilities, setProbabilities] = React.useState<Record<string, number> | null>(null);
    const [maker, setMaker] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(false);

    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>({});
    const [view, setView] = React.useState("1D");
    const [timeRange, setTimeRange] = React.useState("1d");

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

            if (!poolsTableId) {
                console.error("Pools table ID not found in World object");
                return;
            }

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
                            const parsedVal = parseInt(val) / 100;

                            // Convert key (0-7) to 3-bit binary string (e.g. "0" -> "000", "7" -> "111")
                            const keyInt = parseInt(pf.name.value as string);
                            const binaryKey = keyInt.toString(2).padStart(3, '0');

                            console.log(`Converted key ${keyInt} -> "${binaryKey}" with value ${parsedVal}%`);
                            newProbs[binaryKey] = parsedVal;
                        }
                    }

                    if (Object.keys(newProbs).length > 0) {
                        console.log("Setting probabilities state:", newProbs);
                        setProbabilities(newProbs);
                    } else {
                        console.warn("No probabilities found, using defaults");
                        // If empty, set to null so defaults trigger? Or maybe user wants defaults if fails.
                        // But if we have default props, let's let that handle it.
                        // But if we setProbabilities({}), the default in MarketCombinedChart (probabilities || DEFAULT) might see {} as truthy depending on implementation?
                        // In MarketCombinedChart: probabilities || DEFAULT_PROBS. {} is truthy.
                        // So we should set null if empty.
                        setProbabilities(null);
                    }
                } else {
                    console.error("Probs table ID not found in Pool 0");
                }
            } else {
                console.error("Pool 0 not found");
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

    // Trade function - uses Shinami sponsored transactions for gasless betting
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

            // Step 1: Get TEE response
            const teeResponse = await fetch('/api/tee-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: 'process_data', payload: request }),
            });

            const teeData = await teeResponse.json();
            if (!teeData.response?.data || !teeData.signature) {
                alert("TEE Error: " + JSON.stringify(teeData));
                return;
            }

            const betResponse: PlaceBetResponse = teeData.response.data;

            // Calculate new balances
            const makerAddress = maker || account.address;
            const makerCurrentBalance = await getUserWithdrawableBalance(makerAddress);
            const makerNewBalance = makerCurrentBalance + BigInt(betResponse.credit_amount);

            const userCurrentBalance = await getUserWithdrawableBalance(account.address);
            const userNewBalance = userCurrentBalance - BigInt(betResponse.debit_amount);

            // Step 2: Build sponsored transaction via backend
            const buildRequest: BuildSponsoredBetTxRequest = {
                sender: account.address,
                poolId: 0,
                outcome: outcome,
                amount: parseInt(amountStr.replace(/[^0-9]/g, "")) * 1_000_000,
                maker: makerAddress,
                currentProbs: currentProbsArray,
                teeResponse: {
                    shares: betResponse.shares,
                    newProbs: betResponse.new_probs,
                    debitAmount: betResponse.debit_amount,
                    creditAmount: betResponse.credit_amount,
                    timestampMs: teeData.response.timestamp_ms,
                },
                teeSignature: teeData.signature,
                userNewBalance: userNewBalance.toString(),
                makerNewBalance: makerNewBalance.toString(),
            };

            const buildResponse = await fetch('/api/buildSponsoredBetTx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildRequest),
            });

            if (!buildResponse.ok) {
                const errorData = await buildResponse.json();
                throw new Error(errorData.error || 'Failed to build sponsored transaction');
            }

            const sponsoredTx: BuildSponsoredTxResponse = await buildResponse.json();

            // Step 3: Sign the transaction with connected wallet
            const { signature: senderSignature } = await signTransaction({
                transaction: sponsoredTx.txBytes,
            });

            // Step 4: Execute via backend with both signatures
            const executeResponse = await fetch('/api/executeSponsoredTx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txBytes: sponsoredTx.txBytes,
                    sponsorSignature: sponsoredTx.sponsorSignature,
                    senderSignature: senderSignature,
                }),
            });

            if (!executeResponse.ok) {
                const errorData = await executeResponse.json();
                throw new Error(errorData.error || 'Failed to execute transaction');
            }

            const result = await executeResponse.json();
            console.log('Sponsored transaction result:', result);
            alert("Bet Placed! (Gasless) TX: " + result.digest);
            fetchPoolData(); // Refresh

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

    // selectedMarkets is already initialized from COMBINED_MARKETS in useState

    // Auto-switch views based on selections (only when in 1D/2D/3D views, NOT Table/Default)
    React.useEffect(() => {
        // Don't auto-switch if user is in Table or Default view
        if (view === "Table" || view === "Default") {
            return;
        }

        const m1Sel = marketSelections.m1;
        const m2Sel = marketSelections.m2;
        const m3Sel = marketSelections.m3;

        // Count how many are yes/no vs any/null
        const selections = [m1Sel, m2Sel, m3Sel];
        const yesNoCount = selections.filter(s => s === "yes" || s === "no").length;
        const anyOrNullCount = selections.filter(s => s === "any" || s === null).length;

        // If all 3 markets have yes or no (not null, not "any"), switch to 3D
        if (yesNoCount === 3) {
            setView("3D");
        }
        // If exactly 2 have yes/no, switch to 2D
        else if (yesNoCount === 2) {
            setView("2D");
        }
        // If 2+ are any/null, switch to 1D
        else if (anyOrNullCount >= 2) {
            setView("1D");
        }
    }, [marketSelections, view]);

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Site Header */}
            <WalletConnect />

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-32 pb-16">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Left Column: All Content */}
                    <div className="flex-1 min-w-0">
                        <CombinedMarketList
                            title={DEFAULT_MARKET_DATA.title}
                            avatar={DEFAULT_MARKET_DATA.avatar}
                            markets={DEFAULT_MARKET_DATA.markets}
                            selectedMarkets={selectedMarkets}
                            onToggleMarket={toggleMarket}
                        />

                        {/* Context Description */}
                        <div className="mt-4 px-1">
                            <p className="text-gray-500 leading-relaxed text-justify text-[13px]">
                                As of January 2026, Iran is in a state of severe internal upheaval and, to a lesser extent, external conflict following a rapid deterioration of its security and economic situation in the latter half of 2025. The context is defined by a brutal, large-scale crackdown on internal protests, economic collapse, and the aftermath of a direct, 12-day war with Israel in June 2025.
                            </p>
                        </div>

                        <div className="mt-8 text-gray-500">
                            <MarketTimeFilter
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={setView}
                                timeRange={timeRange}
                                onTimeRangeChange={setTimeRange}
                                hideTimeRanges={true}
                                marketSelections={marketSelections}
                            />
                        </div>

                        <div className="mt-8">
                            <MarketLegend
                                items={DEFAULT_MARKET_DATA.legendItems}
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
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20 self-start">
                        <TradeCard
                            marketSelections={marketSelections}
                            onMarketSelectionsChange={setMarketSelections}
                            focusedMarket={focusedMarket}
                            baseProbabilities={probabilities || undefined}
                            targetDate="Jan 1, 2026"
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
