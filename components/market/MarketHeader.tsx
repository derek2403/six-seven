"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bookmark, Link2, ChevronDown } from "lucide-react";

type DatePill =
    | {
        kind: "toggle";
        label: string;
        value: string;
    }
    | {
        kind: "dropdown";
        label: string;
        value: string; // used as a stable id, not selected
        items: { label: string; onSelectValue?: string }[];
    };

type MarketHeaderProps = {
    title: string;
    avatarSrc: string;
    avatarAlt?: string;
    pills: DatePill[];
    defaultSelected?: string; // e.g. "jan-31"
};

export function MarketHeader({
    title,
    avatarSrc,
    avatarAlt = "Market avatar",
    pills,
    defaultSelected,
}: MarketHeaderProps) {
    const firstToggle = React.useMemo(() => {
        const t = pills.find((p) => p.kind === "toggle") as
            | Extract<DatePill, { kind: "toggle" }>
            | undefined;
        return t?.value;
    }, [pills]);

    const [selected, setSelected] = React.useState<string>(
        defaultSelected ?? firstToggle ?? ""
    );

    const onCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // no toast (to match screenshot simplicity)
        } catch {
            // ignore
        }
    };

    return (
        <div className="w-full bg-white">
            {/* Top row: avatar + title + icons */}
            <div className="flex items-start gap-4 px-6 pt-6">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl flex-shrink-0">
                    <Image
                        src={avatarSrc}
                        alt={avatarAlt}
                        fill
                        className="object-cover"
                        sizes="56px"
                        priority
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="truncate text-[28px] font-semibold leading-tight tracking-[-0.02em] text-black">
                            {title}
                        </h1>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                className="p-1 text-black/60 hover:text-black transition-colors"
                                onClick={onCopyLink}
                                aria-label="Copy link"
                            >
                                <Link2 className="h-7 w-7" strokeWidth={1.5} />
                            </button>

                            <button
                                type="button"
                                className="p-1 text-black/60 hover:text-black transition-colors"
                                aria-label="Save"
                            >
                                <Bookmark className="h-7 w-7" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    {/* Pills row */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {/* Toggle group for date pills (radio-like) */}
                        <ToggleGroup
                            type="single"
                            value={selected}
                            onValueChange={(v) => {
                                if (v) setSelected(v);
                            }}
                            spacing={1}
                            className="flex flex-wrap items-center gap-2"
                        >
                            {pills.map((pill) => {
                                if (pill.kind === "toggle") {
                                    return (
                                        <ToggleGroupItem
                                            key={pill.value}
                                            value={pill.value}
                                            className={cn(
                                                // base pill - use !important to override default rounded-none
                                                "h-8 !rounded-full px-4 text-sm font-medium border-0",
                                                // not selected
                                                "bg-gray-100 text-black hover:bg-gray-200",
                                                // selected overrides (ToggleGroup adds data-state)
                                                "data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:hover:bg-black"
                                            )}
                                        >
                                            {pill.label}
                                        </ToggleGroupItem>
                                    );
                                }

                                // dropdown pills: Past / More
                                return (
                                    <DropdownMenu key={pill.value}>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "h-8 rounded-full px-4 text-sm font-medium",
                                                    "bg-gray-100 text-black hover:bg-gray-200",
                                                    "inline-flex items-center gap-1"
                                                )}
                                            >
                                                <span>{pill.label}</span>
                                                <ChevronDown className="h-4 w-4 opacity-60" />
                                            </button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="start"
                                            className="min-w-40 rounded-xl"
                                        >
                                            {pill.items.map((it) => (
                                                <DropdownMenuItem
                                                    key={it.label}
                                                    onSelect={() => {
                                                        // If you want dropdown selections to become "active" like a date,
                                                        // set onSelectValue and it will switch the selected pill.
                                                        if (it.onSelectValue) setSelected(it.onSelectValue);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    {it.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                );
                            })}
                        </ToggleGroup>
                    </div>
                </div>
            </div>

            {/* bottom spacing like screenshot */}
            <div className="h-6" />
        </div>
    );
}
