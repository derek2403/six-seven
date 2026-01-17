"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Clock, Expand, Settings2, Hexagon } from "lucide-react";

type ChartPoint = {
    date: string;
    value: number;
};

type MarketChartProps = {
    data: ChartPoint[];
    currentValue: number;
    change24h: number;
    volume: string;
    endDate: string;
};

const chartConfig = {
    value: {
        label: "Chance",
        color: "#2563eb", // blue-600
    },
};

export function MarketChart({
    data,
    currentValue,
    change24h,
    volume,
    endDate,
}: MarketChartProps) {
    const [timeRange, setTimeRange] = React.useState("MAX");

    return (
        <div className="w-full px-6 pb-6">
            {/* Probability Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-blue-600">
                        {currentValue}% chance
                    </span>
                    <span
                        className={cn(
                            "text-lg font-medium flex items-center",
                            change24h < 0 ? "text-red-500" : "text-green-500"
                        )}
                    >
                        {change24h < 0 ? "▼" : "▲"}
                        {Math.abs(change24h)}%
                    </span>
                </div>

                {/* Polymarket Watermark */}
                <div className="flex items-center gap-2 text-gray-300 opacity-60">
                    <Hexagon className="h-6 w-6 fill-current" strokeWidth={0} />
                    <span className="text-xl font-semibold tracking-tight">Polymarket</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[300px] w-full relative">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            interval="preserveStartEnd"
                            minTickGap={30}
                            tickFormatter={(value) => {
                                // simplify date for axis: "Jan 7 00:00" -> "Jan 7"
                                return value.split(" ").slice(0, 2).join(" ");
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 'auto']}
                        />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <Area
                            dataKey="value"
                            type="monotone"
                            fill="url(#fillValue)"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ChartContainer>
            </div>

            {/* Bottom Metadata & Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="font-medium text-black">{volume} Vol.</span>
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{endDate}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                        {["1H", "6H", "1D", "1W", "1M", "MAX"].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-2 py-1 rounded hover:bg-gray-100 transition-colors",
                                    timeRange === range && "text-orange-500 hover:text-orange-600 hover:bg-transparent"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                        <button className="p-1 hover:text-black transition-colors"><Expand className="h-4 w-4" /></button>
                        <button className="p-1 hover:text-black transition-colors"><Settings2 className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
