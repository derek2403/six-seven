"use client";

import * as React from "react";
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";
import { TradeCard } from "@/components/market/TradeCard";

export function CombinedMarketLayout() {
    return (
        <div className="min-h-screen w-full bg-white">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 pb-12 w-full">
                <div className="grid grid-cols-1 md:grid-cols-[1fr,380px] gap-10 items-start">
                    {/* Left Side: Chart and Headers */}
                    <div className="min-w-0 w-full overflow-hidden">
                        {/* 1. Combined Market List (Header + List Items) */}
                        <CombinedMarketList />

                        {/* 2. Radio Button / Time Filter */}
                        <div className="mt-8">
                            <MarketTimeFilter />
                        </div>

                        {/* 3. Legend */}
                        <div className="mt-10">
                            <MarketLegend />
                        </div>

                        {/* 4. Graph */}
                        <div className="mt-6">
                            <MarketCombinedChart />
                        </div>
                    </div>

                    {/* Right Side: Trade Card */}
                    <div className="w-[380px] hidden md:block">
                        <TradeCard />
                    </div>
                </div>

                {/* Mobile Trade Card (shows below on small screens) */}
                <div className="mt-10 md:hidden">
                    <TradeCard />
                </div>
            </div>
        </div>
    );
}
