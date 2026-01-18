import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { CryptoMarketChart } from "@/components/market/CryptoMarketChart";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { TradeCard } from "@/components/market/TradeCard";
import { MARKET_DATA } from "@/lib/mock/combined-markets";
import { WalletConnect } from "@/components/WalletConnect";
import React, { useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";

export default function CryptoPage() {
    const marketData = MARKET_DATA.crypto;

    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>({});
    const [view, setView] = React.useState("Default");
    const [timeRange, setTimeRange] = React.useState("1d");

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

    // Auto-switch views based on selections (only when in 1D/2D/3D views, NOT Table/Default)
    useEffect(() => {
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

    // Merge live prices into markets
    const displayMarkets = useMemo(() => {
        return marketData.markets.map(m => {
            const coinId = CRYPTO_COIN_MAP[m.id];
            const data = coinId ? liveData[coinId] : undefined;
            return {
                ...m,
                livePrice: data?.price,
                priceChange24h: data?.change24h
            };
        });
    }, [marketData, liveData]);

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
                                onViewChange={setView}
                                timeRange={timeRange}
                                onTimeRangeChange={setTimeRange}
                                hideTimeRanges={true}
                                marketSelections={marketSelections}
                            />
                        </div>

                        <div className="mt-8">
                            <MarketLegend
                                items={marketData.legendItems}
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={setView}
                            />
                        </div>

                        <div className="mt-4">
                            <CryptoMarketChart
                                data={marketData.chartData}
                                markets={marketData.markets}
                                selectedMarkets={selectedMarkets}
                                view={view}
                                marketSelections={marketSelections}
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
