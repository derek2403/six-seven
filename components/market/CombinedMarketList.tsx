"use client";

import * as React from "react";
import Image from "next/image";
import { Link2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMBINED_MARKETS } from "@/lib/mock/combined-markets";

export function CombinedMarketList() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-full">
            {COMBINED_MARKETS.map((market, idx) => (
                <div key={market.id} className="flex items-center gap-4 w-full">
                    {/* Avatar */}
                    <div className="relative h-14 w-14 flex-shrink-0">
                        <Image
                            src={market.avatar}
                            alt={market.title}
                            fill
                            unoptimized
                            className="rounded-xl object-cover"
                        />
                    </div>

                    <div className="flex items-center justify-between w-full min-w-0 overflow-hidden">
                        {/* Title - One Line */}
                        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-black truncate whitespace-nowrap">
                            {market.title}
                        </h1>

                        {/* Header Icons only for first item */}
                        {idx === 0 && (
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                <Button variant="ghost" className="h-[56px] w-[56px] p-0 text-gray-400 hover:text-black hover:bg-transparent">
                                    <Link2 className="size-11" strokeWidth={1.5} />
                                </Button>
                                <Button variant="ghost" className="h-[56px] w-[56px] p-0 text-gray-400 hover:text-black hover:bg-transparent">
                                    <Bookmark className="size-11" strokeWidth={1.5} />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
