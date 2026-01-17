import { useRouter } from 'next/router';
import { CombinedMarketLayout } from "@/components/market/CombinedMarketLayout";
import React from 'react';

export default function MarketPage() {
    const router = useRouter();
    const { slug } = router.query;

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Site Header - same as pages/data.tsx */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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

            {/* Combined Market Layout */}
            <main className="min-h-0 bg-white pt-8">
                <CombinedMarketLayout />
            </main>
        </div>
    );
}
