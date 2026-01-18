import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { CryptoMarketChart } from "@/components/market/CryptoMarketChart";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { TradeCard } from "@/components/market/TradeCard";
import { MARKET_DATA } from "@/lib/mock/combined-markets";
import pricingData from '@/data/crypto-prices.json';
import { WalletConnect } from "@/components/WalletConnect";
import React, { useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { PlaceBetRequest, PlaceBetResponse, PM_CONFIG } from '@/lib/tee';
import { VAULT_CONFIG, WORLD_CONFIG } from '@/lib/config';
import type { BuildSponsoredBetTxRequest, BuildSponsoredTxResponse } from '@/lib/shinami-types';

export default function CryptoPage() {
    const marketData = MARKET_DATA.crypto;

    // Sui Hooks
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutateAsync: signTransaction } = useSignTransaction();

    // Backend State for Pool 1
    const [poolProbabilities, setPoolProbabilities] = React.useState<Record<string, number> | null>(null);
    const [maker, setMaker] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(false);

    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>({});
    const [view, setView] = React.useState("2D");
    const [timeRange, setTimeRange] = React.useState("1d");
    const [targetDate, setTargetDate] = React.useState("Jan 31, 2026");

    // Market selections for Order Ticket (lifted state)
    const [marketSelections, setMarketSelections] = React.useState<Record<string, "yes" | "no" | "any" | null>>({
        m1: null,
        m2: null,
        m3: null,
    });

    // Focused market for line selection (only one market active at a time)
    const [focusedMarket, setFocusedMarket] = React.useState<string | null>(null);

    // Store live prices: Coin Address -> { price, change24h }
    interface PriceData { price: number; change24h: number; }
    const [liveData, setLiveData] = React.useState<Record<string, PriceData>>({});

    // Map IDs to Noodles Coin Addresses for Crypto
    const CRYPTO_COIN_MAP: Record<string, string> = {
        "m1": "0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC", // Bitcoin
        "m2": "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN", // Ethereum
        "m3": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", // Sui
    };

    // Fetch Prices Effect
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const coins = Object.values(CRYPTO_COIN_MAP);
                const res = await fetch(`/api/integrations/noodles?coins=${encodeURIComponent(coins.join(','))}`);
                const data = await res.json();

                if (data.data && Array.isArray(data.data)) {
                    setLiveData(prev => {
                        const updated = { ...prev };
                        data.data.forEach((item: any) => {
                            // Only update if we have a valid price
                            if (item.coin && item.price != null && !isNaN(item.price)) {
                                updated[item.coin] = {
                                    price: item.price,
                                    change24h: item.price_change_24h || prev[item.coin]?.change24h || 0
                                };
                            }
                        });
                        return updated;
                    });
                }
            } catch (e) {
                console.error("Failed to fetch prices", e);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 1000);
        return () => clearInterval(interval);
    }, []);

    // Initialize selected markets when marketData changes
    useEffect(() => {
        if (marketData) {
            setSelectedMarkets(
                Object.fromEntries(marketData.markets.map(m => [m.id, true]))
            );
        }
    }, [marketData]);

    const [isAutoView, setIsAutoView] = React.useState(true);

    // Track previous selections to detect changes
    const prevSelectionsRef = React.useRef(marketSelections);

    const handleViewChange = (v: string, isAuto?: boolean) => {
        setView(v);
        if (isAuto !== undefined) {
            setIsAutoView(isAuto);
        }
    };

    // Auto-switch views based on selections (only when in Auto mode and dimensional views)
    useEffect(() => {
        // Detect if selections actually changed
        const hasChanged = JSON.stringify(prevSelectionsRef.current) !== JSON.stringify(marketSelections);
        prevSelectionsRef.current = marketSelections;

        // Requirement: Only auto-switch if we are in AUTO mode and currently in a dimensional view
        const isDimensionalView = ["2D", "3D", "4D"].includes(view);

        if (!hasChanged || !isAutoView || !isDimensionalView) {
            return;
        }

        const m1Sel = marketSelections.m1;
        const m2Sel = marketSelections.m2;
        const m3Sel = marketSelections.m3;

        // Count how many are yes/no vs any/null
        const selections = [m1Sel, m2Sel, m3Sel];
        const yesNoCount = selections.filter(s => s === "yes" || s === "no").length;
        const anyOrNullCount = selections.filter(s => s === "any" || s === null).length;

        // If all 3 markets have yes or no (not null, not "any"), switch to 4D
        if (yesNoCount === 3) {
            if (view !== "4D") setView("4D");
        }
        // If exactly 2 have yes/no, switch to 3D
        else if (yesNoCount === 2) {
            if (view !== "3D") setView("3D");
        }
        // If 2+ are any/null, switch to 2D
        else if (anyOrNullCount >= 2) {
            if (view !== "2D") setView("2D");
        }
    }, [marketSelections, view, isAutoView]);

    // Fetch Pool 1 Data
    const fetchPoolData = async () => {
        try {
            const worldObj = await client.getObject({
                id: WORLD_CONFIG.WORLD_ID,
                options: { showContent: true }
            });

            const poolsTableId = worldObj.data?.content && 'fields' in worldObj.data.content
                ? (worldObj.data.content.fields as any).pools?.fields?.id?.id
                : null;

            if (!poolsTableId) return;

            // Get Pool 1 for Crypto
            const poolField = await client.getDynamicFieldObject({
                parentId: poolsTableId,
                name: { type: 'u64', value: '1' }
            });

            if (poolField.data?.content && 'fields' in poolField.data.content) {
                const poolContent = (poolField.data.content.fields as any).value.fields;
                const probsTableId = poolContent.probabilities?.fields?.id?.id;

                if (probsTableId) {
                    const probFields = await client.getDynamicFields({ parentId: probsTableId });
                    const newProbs: Record<string, number> = {};

                    for (const pf of probFields.data) {
                        const pItem = await client.getObject({ id: pf.objectId, options: { showContent: true } });
                        if (pItem.data?.content && 'fields' in pItem.data.content) {
                            const val = (pItem.data.content.fields as any).value;
                            const keyInt = parseInt(pf.name.value as string);
                            const binaryKey = keyInt.toString(2).padStart(3, '0');
                            newProbs[binaryKey] = parseInt(val) / 100;
                        }
                    }

                    if (Object.keys(newProbs).length > 0) {
                        setPoolProbabilities(newProbs);
                    }
                }
            }

            fetchMakerForPool(1);
        } catch (error) {
            console.error("Error fetching pool data:", error);
        }
    };

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

    // Trade function - uses Shinami sponsored transactions for gasless betting
    const handleTrade = async (amountStr: string, outcome: number) => {
        if (!account) {
            alert("Please connect wallet");
            return;
        }
        setIsLoading(true);
        try {
            const currentProbsArray = Array(8).fill(1250);
            if (poolProbabilities) {
                ['000', '001', '010', '011', '100', '101', '110', '111'].forEach((k, i) => {
                    if (poolProbabilities[k] !== undefined) currentProbsArray[i] = Math.round(poolProbabilities[k] * 100);
                });
            }

            const request: PlaceBetRequest = {
                user: account.address,
                pool_id: 1, // Pool 1 for Crypto
                outcome: outcome,
                amount: parseInt(amountStr.replace(/[^0-9]/g, "")) * 1_000_000,
                maker: maker,
                current_probs: currentProbsArray,
            };

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

            const makerAddress = maker || account.address;
            const makerCurrentBalance = await getUserWithdrawableBalance(makerAddress);
            const makerNewBalance = makerCurrentBalance + BigInt(betResponse.credit_amount);

            const userCurrentBalance = await getUserWithdrawableBalance(account.address);
            const userNewBalance = userCurrentBalance - BigInt(betResponse.debit_amount);

            const buildRequest: BuildSponsoredBetTxRequest = {
                sender: account.address,
                poolId: 1,
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

            const { signature: senderSignature } = await signTransaction({
                transaction: sponsoredTx.txBytes,
            });

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
            fetchPoolData();

        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Pool 1 data on mount
    useEffect(() => {
        fetchPoolData();
        const interval = setInterval(fetchPoolData, 5000);
        return () => clearInterval(interval);
    }, [client]);

    // Calculate "real rate" probabilities based on pricingData
    const probabilities = useMemo(() => {
        const monthMap: Record<string, string> = {
            "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
            "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
        };

        // targetDate format: "Jan 15, 2026" -> "2026-01-15"
        const parts = targetDate.replace(',', '').split(' ');
        const formattedTargetDate = `${parts[2]}-${monthMap[parts[0]]}-${parts[1].padStart(2, '0')}`;

        const getProb = (asset: string, targetPrice: number) => {
            const history = (pricingData as any)[asset] || [];
            // Find price on or before formattedTargetDate
            const pricePoint = history.findLast((h: any) => h.date <= formattedTargetDate) || history[history.length - 1];

            if (!pricePoint) return 50; // Fallback

            const currentPrice = pricePoint.price;
            if (currentPrice >= targetPrice) {
                // Capped at 70% per asset. (0.7 * 0.7 * 0.7 = ~34% max joint prob)
                return Math.min(70, 65 + (currentPrice / targetPrice - 1) * 5);
            } else {
                // Probability scales with closeness to target (individual ~50% max)
                return (currentPrice / targetPrice) * 50;
            }
        };

        return {
            m1: getProb("bitcoin", 100000),
            m2: getProb("ethereum", 4000),
            m3: getProb("sui", 5.0)
        };
    }, [targetDate]);

    // Merge live prices into markets
    const displayMarkets = useMemo(() => {
        return marketData.markets.map(m => {
            const coinId = CRYPTO_COIN_MAP[m.id];
            const data = coinId ? liveData[coinId] : undefined;
            // Update title with targetDate
            const baseTitle = m.title.split(' in ')[0];
            const updatedTitle = `${baseTitle} by ${targetDate}?`;

            return {
                ...m,
                title: updatedTitle,
                livePrice: data?.price,
                priceChange24h: data?.change24h
            };
        });
    }, [marketData, liveData, targetDate]);

    const toggleMarket = (id: string) => {
        setSelectedMarkets(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="min-h-screen bg-white font-sans">

            <WalletConnect />

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-32 pb-16">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Left Column: All Content */}
                    <div className="flex-1 min-w-0">
                        <CombinedMarketList
                            title={marketData.title}
                            avatar={marketData.avatar}
                            markets={displayMarkets}
                            selectedMarkets={selectedMarkets}
                            onToggleMarket={toggleMarket}
                        />

                        {/* Context Description */}
                        <div className="mt-4 px-1">
                            <p className="text-gray-500 leading-relaxed text-justify text-[13px]">
                                In early 2026, the cryptocurrency market is in a strong upward trend, driven by increased institutional participation, substantial inflows into Bitcoin ETFs, and wider mainstream adoption. Bitcoin has moved beyond its prior all-time highs, while Ethereum continues to grow through the expansion of its Layer 2 ecosystem. At the same time, newer altcoins such as Sui are attracting attention due to their innovative blockchain designs. Overall market sentiment remains optimistic, with traders anticipating further price gains.
                            </p>
                        </div>

                        <div className="mt-8 text-gray-500">
                            <MarketTimeFilter
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={handleViewChange}
                                timeRange={timeRange}
                                onTimeRangeChange={setTimeRange}
                                hideTimeRanges={true}
                                marketSelections={marketSelections}
                                isCrypto={true}
                            />
                        </div>

                        <div className="mt-8">
                            <MarketLegend
                                items={marketData.legendItems}
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={handleViewChange}
                            />
                        </div>

                        <div className="mt-4">
                            <CryptoMarketChart
                                data={marketData.chartData}
                                markets={displayMarkets}
                                selectedMarkets={selectedMarkets}
                                view={view}
                                marketSelections={marketSelections}
                                targetDate={targetDate}
                                baseProbabilities={probabilities}
                                poolProbabilities={poolProbabilities}
                                onTargetDateChange={setTargetDate}
                                onMarketSelectionsChange={setMarketSelections}
                            />
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20 self-start">
                        <TradeCard
                            markets={displayMarkets}
                            marketSelections={marketSelections}
                            onMarketSelectionsChange={setMarketSelections as any}
                            focusedMarket={focusedMarket}
                            baseProbabilities={probabilities}
                            targetDate={targetDate}
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
