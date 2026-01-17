"use client";

import { useState } from "react";
import { LEGEND_ITEMS } from "@/lib/mock/combined-markets";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ChevronDown } from "lucide-react";

export function MarketLegend() {
    const [view, setView] = useState("Default");

    return (
        <div className="flex items-start justify-between w-full pr-1">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-4">
                {LEGEND_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-gray-500">{item.label}</span>
                        <span className="text-sm font-bold text-black">{item.value}</span>
                    </div>
                ))}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="pt-0.5">
                        <RainbowButton className="h-7 text-[12px] font-bold px-4 flex items-center gap-2 min-w-[100px]">
                            {view}
                            <ChevronDown className="size-4 opacity-70" />
                        </RainbowButton>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[120px] bg-white border border-gray-100 shadow-sm rounded-xl p-1">
                    {["Default", "1D", "2D", "3D"].map((v) => (
                        <DropdownMenuItem
                            key={v}
                            onClick={() => setView(v)}
                            className={`font-bold text-[13px] cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 justify-center ${view === v ? "text-blue-600 bg-blue-50/50" : "text-gray-900"}`}
                        >
                            {v}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
