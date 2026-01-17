import { useRouter } from 'next/router';
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { CryptoMarketChart } from "@/components/market/CryptoMarketChart";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";
import { MARKET_DATA, DEFAULT_MARKET_DATA } from "@/lib/mock/combined-markets";
import { WalletConnect } from "@/components/WalletConnect";
import React, { useEffect, useMemo } from 'react';

type MarketSelection = "yes" | "no" | "any" | null;

export default function MarketPage() {
    const router = useRouter();
    const { slug } = router.query;

    // Determine which data to use based on slug
    const marketData = useMemo(() => {
        if (!slug || typeof slug !== 'string') return DEFAULT_MARKET_DATA;
        const key = slug.toLowerCase();
        return MARKET_DATA[key] || DEFAULT_MARKET_DATA;
    }, [slug]);

    // Initialize selected markets when marketData changes
    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>({});

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
        if (slug !== 'crypto') return;

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
    }, [slug]);

    useEffect(() => {
        if (marketData) {
            setSelectedMarkets(
                Object.fromEntries(marketData.markets.map(m => [m.id, true]))
            );
        }
    }, [marketData]);

    // Merge live prices into markets
    const displayMarkets = useMemo(() => {
        if (slug !== 'crypto') return marketData.markets;

        return marketData.markets.map(m => {
            const coinId = CRYPTO_COIN_MAP[m.id];
            const data = coinId ? liveData[coinId] : undefined;
            return {
                ...m,
                livePrice: data?.price,
                priceChange24h: data?.change24h
            };
        });
    }, [marketData, liveData, slug]);

    const [view, setView] = React.useState("Default");

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
                            <p className="text-[13px] text-gray-500 leading-relaxed text-justify">
                                {slug === 'crypto' ? (
                                    "In early 2026, the cryptocurrency market is in a strong upward trend, driven by increased institutional participation, substantial inflows into Bitcoin ETFs, and wider mainstream adoption. Bitcoin has moved beyond its prior all-time highs, while Ethereum continues to grow through the expansion of its Layer 2 ecosystem. At the same time, newer altcoins such as Sui are attracting attention due to their innovative blockchain designs. Overall market sentiment remains optimistic, with traders anticipating further price gains."
                                ) : (
                                    "As of January 2026, Iran is in a state of severe internal upheaval and, to a lesser extent, external conflict following a rapid deterioration of its security and economic situation in the latter half of 2025. The context is defined by a brutal, large-scale crackdown on internal protests, economic collapse, and the aftermath of a direct, 12-day war with Israel in June 2025."
                                )}
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
                                items={marketData.legendItems}
                                selectedMarkets={selectedMarkets}
                                view={view}
                                onViewChange={setView}
                            />
                        </div>



                        <div className="mt-4">
                            {slug === 'crypto' ? (
                                <CryptoMarketChart
                                    data={marketData.chartData}
                                    markets={marketData.markets}
                                    selectedMarkets={selectedMarkets}
                                    view={view}
                                />
                            ) : (
                                <MarketCombinedChart
                                    selectedMarkets={selectedMarkets}
                                    view={view}
                                    marketSelections={marketSelections}
                                    onMarketSelectionsChange={setMarketSelections}
                                    focusedMarket={focusedMarket}
                                    onFocusedMarketChange={setFocusedMarket}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20">
                        <TradeCard
                            markets={displayMarkets}
                            marketSelections={marketSelections}
                            onMarketSelectionsChange={setMarketSelections}
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
