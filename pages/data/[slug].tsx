import { useRouter } from 'next/router';
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";
import { COMBINED_MARKETS } from "@/lib/mock/combined-markets";
import React from 'react';

type MarketSelection = "yes" | "no" | "any" | null;

export default function MarketPage() {
    const router = useRouter();
    const { slug } = router.query;

    const [selectedMarkets, setSelectedMarkets] = React.useState<Record<string, boolean>>(
        Object.fromEntries(COMBINED_MARKETS.map(m => [m.id, true]))
    );
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
                            />
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-full md:w-[400px] flex-shrink-0 sticky top-20">
                        <TradeCard
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
