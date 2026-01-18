"use client";

import * as React from "react";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RainbowButton } from "@/components/ui/rainbow-button";

type MarketSelection = "yes" | "no" | "any" | null;

interface MarketTimeFilterProps {
    selectedMarkets: Record<string, boolean>;
    view: string;
    onViewChange: (view: string) => void;
    timeRange?: string;
    onTimeRangeChange?: (range: string) => void;
    hideTimeRanges?: boolean;
    marketSelections?: Record<string, MarketSelection>;
}

export function MarketTimeFilter({
    selectedMarkets,
    view,
    onViewChange,
    timeRange = "1d",
    onTimeRangeChange,
    hideTimeRanges = false,
    marketSelections
}: MarketTimeFilterProps) {
    const selectedCount = Object.values(selectedMarkets).filter(Boolean).length;
    const commonBtnClasses = "h-[36px] !rounded-full px-4 text-sm font-bold transition-all flex items-center justify-center gap-1";

    let availableDimensions: string[] = [];
    if (selectedCount >= 1) availableDimensions.push("1D");
    if (selectedCount >= 2) availableDimensions.push("2D");
    if (selectedCount >= 3) availableDimensions.push("3D");

    const isDimensionView = ["1D", "2D", "3D"].includes(view);

    const timeRanges = ["15 min", "1h", "4h", "1d", "1w", "All"];

    // Calculate target dimension based on marketSelections
    const getTargetDimension = React.useMemo(() => {
        if (!marketSelections) return availableDimensions[0] || "1D";

        const selections = [marketSelections.m1, marketSelections.m2, marketSelections.m3];
        const yesNoCount = selections.filter(s => s === "yes" || s === "no").length;

        if (yesNoCount === 3) return "3D";
        if (yesNoCount === 2) return "2D";
        return "1D";
    }, [marketSelections, availableDimensions]);

    return (
        <div className="flex flex-wrap items-center gap-3 pl-0">
            {/* View Selection: Chart / Table */}
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
                        {v === "Default" ? "Chart" : v}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>

            {/* Dimension Button - shows target dimension based on selections */}
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
                        onClick={() => onViewChange(getTargetDimension)}
                        variant="outline"
                        className={cn(
                            "h-[36px] text-sm font-bold px-5 flex items-center gap-2 rounded-full transition-transform active:scale-95"
                        )}
                    >
                        {getTargetDimension}
                        <ChevronDown className="size-4 opacity-70" />
                    </RainbowButton>
                )
            )}

            {!hideTimeRanges && (
                <>
                    <div className="h-6 w-px bg-gray-100 mx-1" />

                    {/* Time Ranges */}
                    <ToggleGroup
                        type="single"
                        value={timeRange}
                        onValueChange={(v) => {
                            if (v && onTimeRangeChange) {
                                onTimeRangeChange(v);
                            }
                        }}
                        className="gap-1"
                    >
                        {timeRanges.map((range) => (
                            <ToggleGroupItem
                                key={range}
                                value={range}
                                className={cn(
                                    "h-[32px] rounded-lg px-3 text-[13px] font-bold transition-all",
                                    timeRange === range
                                        ? "bg-gray-100 text-black shadow-sm"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
                                )}
                            >
                                {range}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <div className="h-6 w-px bg-gray-100 mx-1" />
                </>
            )}
        </div>
    );
}
