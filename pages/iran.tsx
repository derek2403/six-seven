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
    const [timeRange, setTimeRange] = React.useState("1d");

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
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20 self-start">
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
