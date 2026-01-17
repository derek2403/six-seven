import { useRouter } from 'next/router';
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";
import React from 'react';

export default function MarketPage() {
    const router = useRouter();
    const { slug } = router.query;

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
                        <CombinedMarketList />

                        <div className="mt-8 text-gray-500">
                            <MarketTimeFilter />
                        </div>

                        <div className="mt-8">
                            <MarketLegend />
                        </div>

                        <div className="mt-4">
                            <MarketCombinedChart />
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-full md:w-[320px] flex-shrink-0 sticky top-20">
                        <TradeCard />
                        <p className="mt-4 text-center text-[13px] text-gray-400 font-medium leading-relaxed">
                            By trading, you agree to the <span className="underline cursor-pointer hover:text-gray-600 transition-colors">Terms of Use.</span>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
