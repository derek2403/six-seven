"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RainbowButton } from "@/components/ui/rainbow-button";

interface MarketTimeFilterProps {
    selectedMarkets: Record<string, boolean>;
    view: string;
    onViewChange: (view: string) => void;
}

export function MarketTimeFilter({ selectedMarkets, view, onViewChange }: MarketTimeFilterProps) {
    const selectedCount = Object.values(selectedMarkets).filter(Boolean).length;
    const commonBtnClasses = "h-[36px] !rounded-full px-4 text-sm font-bold transition-all flex items-center justify-center gap-1";

    let availableDimensions: string[] = [];
    if (selectedCount >= 1) availableDimensions.push("1D");
    if (selectedCount >= 2) availableDimensions.push("2D");
    if (selectedCount >= 3) availableDimensions.push("3D");

    const isDimensionView = ["1D", "2D", "3D"].includes(view);

    return (
        <div className="flex flex-wrap items-center gap-2 pl-0">
            <ToggleGroup
                type="single"
                value={view === "Default" || view === "Table" ? view : ""}
                onValueChange={(v) => v && onViewChange(v)}
                className="gap-2"
            >
                {["Default", "Table"].map((v) => (
                    <ToggleGroupItem
                        key={v}
                        value={v}
                        className={cn(
                            commonBtnClasses,
                            "data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:hover:bg-black",
                            "data-[state=off]:bg-gray-100 data-[state=off]:text-gray-500 hover:bg-gray-200"
                        )}
                    >
                        {v}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>

            {availableDimensions.length > 0 && (
                isDimensionView ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="relative group">
                                <RainbowButton
                                    variant="default"
                                    className={cn(
                                        "h-[36px] text-sm font-bold px-5 flex items-center gap-2 rounded-full transition-transform active:scale-95"
                                    )}
                                >
                                    {view}
                                    <ChevronDown className="size-4 opacity-70" />
                                </RainbowButton>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[120px] bg-white border border-gray-100 shadow-sm rounded-xl p-1">
                            {availableDimensions.map((d) => (
                                <DropdownMenuItem
                                    key={d}
                                    onClick={() => onViewChange(d)}
                                    className={`font-bold text-[13px] cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 justify-center ${view === d ? "text-blue-600 bg-blue-50/50" : "text-gray-900"}`}
                                >
                                    {d}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <RainbowButton
                        onClick={() => onViewChange(availableDimensions[0])}
                        variant="outline"
                        className={cn(
                            "h-[36px] text-sm font-bold px-5 flex items-center gap-2 rounded-full transition-transform active:scale-95"
                        )}
                    >
                        {availableDimensions[0]}
                        <ChevronDown className="size-4 opacity-70" />
                    </RainbowButton>
                )
            )}
                </div>
    );
}
