import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";
import { MARKET_DATA } from "@/lib/mock/combined-markets";
import { WalletConnect } from "@/components/WalletConnect";
import React from 'react';

type MarketSelection = "yes" | "no" | "any" | null;

export default function IranPage() {
    const marketData = MARKET_DATA.iran;

    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>({});
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

    // Initialize selected markets when marketData changes
    React.useEffect(() => {
        if (marketData) {
            setSelectedMarkets(
                Object.fromEntries(marketData.markets.map(m => [m.id, true]))
            );
        }
    }, [marketData]);

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
                            markets={marketData.markets}
                            selectedMarkets={selectedMarkets}
                            onToggleMarket={toggleMarket}
                        />

                        {/* Context Description */}
                        <div className="mt-4 px-1">
                            <p className="text-[13px] text-gray-500 leading-relaxed text-justify">
                                As of January 2028, Iran is in a state of severe internal upheaval and, to a lesser extent, external conflict following a rapid deterioration of its security and economic situation in the latter half of 2027. The context is defined by a brutal, large-scale crackdown on internal protests, economic collapse, and the aftermath of a direct, 12-day war with Israel in June 2027.
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
                            <MarketCombinedChart
                                selectedMarkets={selectedMarkets}
                                view={view}
                                marketSelections={marketSelections}
                                onMarketSelectionsChange={setMarketSelections}
                                focusedMarket={focusedMarket}
                                onFocusedMarketChange={setFocusedMarket}
                            />
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20">
                        <TradeCard
                            markets={marketData.markets}
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
