"use client";

import { LEGEND_ITEMS } from "@/lib/mock/combined-markets";

export function MarketLegend() {
    return (
        <div className="flex flex-wrap items-center gap-6 pl-4">
            {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-black">{item.value}</span>
                </div>
            ))}
        </div>
    );
}
