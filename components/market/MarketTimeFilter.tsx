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

export function MarketTimeFilter() {
    const [selectedPill, setSelectedPill] = React.useState("jan-31");

    const commonBtnClasses = "h-[36px] !rounded-full px-4 text-sm font-bold transition-all flex items-center justify-center gap-1";

    return (
        <div className="flex flex-wrap items-center gap-2 pl-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(commonBtnClasses, "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                        Past <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem>Past 24h</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>

            {/* Set spacing={1} to prevent ToggleGroupItem from applying segmented-control logic (rounded-none) */}
            <ToggleGroup
                type="single"
                value={selectedPill}
                onValueChange={(v) => v && setSelectedPill(v)}
                className="gap-2"
                spacing={1}
            >
                {["Jan 31", "Feb 28", "Mar 31", "Jun 30"].map((date) => (
                    <ToggleGroupItem
                        key={date}
                        value={date.toLowerCase().replace(' ', '-')}
                        className={cn(
                            commonBtnClasses,
                            "data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:hover:bg-black",
                            "data-[state=off]:bg-gray-100 data-[state=off]:text-gray-500 hover:bg-gray-200"
                        )}
                    >
                        {date}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(commonBtnClasses, "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                        More <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem>Future</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
