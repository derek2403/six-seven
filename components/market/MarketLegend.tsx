"use client";

import { LegendItem } from "@/lib/mock/combined-markets";

interface MarketLegendProps {
    items: LegendItem[];
    selectedMarkets: Record<string, boolean>;
    view: string;
    onViewChange: (view: string) => void;
}

export function MarketLegend({ items, selectedMarkets }: MarketLegendProps) {
    const filteredLegendItems = items.filter((_, idx) => {
        const marketId = `m${idx + 1}`;
        return selectedMarkets[marketId];
    });

    return (
        <div className="flex items-start justify-between w-full pr-1">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-4">
                {filteredLegendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-gray-500">{item.label}</span>
                        <span className="text-sm font-bold text-black">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
