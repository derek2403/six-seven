"use client";

import * as React from "react";
import { CombinedMarketList } from "@/components/market/CombinedMarketList";
import { MarketTimeFilter } from "@/components/market/MarketTimeFilter";
import { MarketLegend } from "@/components/market/MarketLegend";
import { MarketCombinedChart } from "@/components/market/MarketCombinedChart";

export function CombinedMarketLayout() {
    return (
        <div className="min-h-screen w-full bg-white">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 pb-12">

                {/* 1. Combined Market List (Header + List Items) */}
                <CombinedMarketList />

                {/* 2. Radio Button / Time Filter */}
                <div className="mt-6">
                    <MarketTimeFilter />
                </div>

                {/* 3. Legend */}
                <div className="mt-8">
                    <MarketLegend />
                </div>

                {/* 4. Graph */}
                <div className="mt-4">
                    <MarketCombinedChart />
                </div>

            </div>
        </div>
    );
}
