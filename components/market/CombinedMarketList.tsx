"use client";

import * as React from "react";
import Image from "next/image";
import { Link2, Bookmark, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CombinedMarketItem } from "@/lib/mock/combined-markets";
import { cn } from "@/lib/utils";
import { CryptoPriceStrip } from "./CryptoPriceStrip";

interface CombinedMarketListProps {
    title: string;
    avatar: string;
    markets: CombinedMarketItem[];
    selectedMarkets: Record<string, boolean>;
    onToggleMarket: (id: string) => void;
}

export function CombinedMarketList({ title, avatar, markets, selectedMarkets, onToggleMarket }: CombinedMarketListProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const toggleMarket = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleMarket(id);
    };

    return (
        <div className="flex flex-col w-full max-w-full bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            {/* Main Header Row */}
            <div
                className="flex items-center gap-3 w-full p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Unified Avatar */}
                <div className="relative h-12 w-12 flex-shrink-0">
                    <Image
                        src={avatar}
                        alt={title}
                        fill
                        unoptimized
                        className="rounded-lg object-cover border border-gray-100"
                    />
                </div>

                <div className="flex items-center justify-between w-full min-w-0">
                    {/* Title and Collapse Trigger */}
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-black truncate">
                            {title}
                        </h1>
                        <div className={cn(
                            "transition-transform duration-200 text-gray-400",
                            isExpanded ? "rotate-180" : ""
                        )}>
                            <ChevronDown className="size-5" />
                        </div>
                    </div>

                    {/* Header Icons */}
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
                            <Link2 className="size-6" strokeWidth={2} />
                        </Button>
                        <Button variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
                            <Bookmark className="size-6" strokeWidth={2} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sub-markets Accordion Content */}
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-50",
                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-1 pb-2">
                    {markets.map((market) => (
                        <div
                            key={market.id}
                            className="flex items-center justify-between p-3 px-4 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors group"
                            onClick={(e) => toggleMarket(market.id, e)}
                        >
                            {/* Left: Avatar + Title (flexible width to avoid truncation) */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="relative h-7 w-7 flex-shrink-0">
                                    <Image
                                        src={market.avatar}
                                        alt={market.title}
                                        fill
                                        unoptimized
                                        className="rounded-full object-cover border border-gray-100"
                                    />
                                </div>
                                <span className="text-[15px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors whitespace-nowrap">
                                    {market.title}
                                </span>
                            </div>

                            {/* Middle: Price Strip (takes remaining space, right-aligned content) */}
                            <div className="flex-1 flex justify-end">
                                {market.livePrice && market.targetPrice && (
                                    <CryptoPriceStrip
                                        currentPrice={market.livePrice}
                                        targetPrice={market.targetPrice}
                                        priceChange24h={market.priceChange24h}
                                    />
                                )}

                                {market.livePrice && !market.targetPrice && (
                                    <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                        ${market.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>

                            {/* Right: Checkbox */}
                            <div className={cn(
                                "flex items-center justify-center h-5 w-5 rounded border transition-all duration-200 ml-4",
                                selectedMarkets[market.id]
                                    ? "bg-blue-600 border-blue-600 shadow-sm"
                                    : "bg-white border-gray-300"
                            )}>
                                {selectedMarkets[market.id] && (
                                    <Check className="size-3.5 text-white" strokeWidth={4} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
