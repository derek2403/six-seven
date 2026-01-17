"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy, Clock, Settings, SlidersHorizontal } from "lucide-react";
import { COMBINED_CHART_DATA } from "@/lib/mock/combined-markets";

const MARKET_NAMES: Record<string, string> = {
    value1: "Khamenei out",
    value2: "US strikes Iran",
    value3: "Israel next strikes",
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="pl-2 pointer-events-none transform -translate-y-full mt-[-15px]">
                <p className="text-[14px] text-gray-400 font-medium whitespace-nowrap">{label}</p>
            </div>
        );
    }
    return null;
};

const CustomActiveDot = (props: any) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    const value = payload[dataKey];
    const name = MARKET_NAMES[dataKey] || dataKey;

    // Use a solid color mapping just in case 'stroke' isn't what we expect
    const colors: Record<string, string> = {
        value1: "#60a5fa",
        value2: "#2563eb",
        value3: "#facc15",
    };
    const pillColor = colors[dataKey] || stroke || "#ccc";

    return (
        <g>
            <circle cx={cx} cy={cy} r={4} fill={pillColor} stroke="white" strokeWidth={2} />
            <foreignObject x={cx + 8} y={cy - 12} width={150} height={24}>
                <div
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm"
                    style={{ backgroundColor: pillColor }}
                >
                    {name} {value}%
                </div>
            </foreignObject>
        </g>
    );
};

// CustomDot: key prop is removed to avoid React special prop access error
const CustomDot = (props: any) => {
    const { cx, cy, index, lastIndex, color } = props;
    if (index === lastIndex) {
        return (
            <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />
        );
    }
    return null;
};

export function MarketCombinedChart() {
    return (
        <div className="w-full flex flex-col">
            <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={COMBINED_CHART_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            minTickGap={60}
                            tickFormatter={(val) => {
                                const [month] = val.split(' ');
                                return month;
                            }}
                        />
                        <YAxis
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            tickFormatter={(val) => `${val}%`}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                            coordinate={{ y: 0 }}
                            position={{ y: 20 }} // Lowered from 10 to 20
                        />
                        <Line
                            type="linear"
                            dataKey="value1"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            dot={(props) => {
                                const { key, ...rest } = props;
                                return <CustomDot key={key} {...rest} color="#60a5fa" lastIndex={COMBINED_CHART_DATA.length - 1} />;
                            }}
                            activeDot={<CustomActiveDot />}
                            isAnimationActive={false}
                        />
                        <Line
                            type="linear"
                            dataKey="value2"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={(props) => {
                                const { key, ...rest } = props;
                                return <CustomDot key={key} {...rest} color="#2563eb" lastIndex={COMBINED_CHART_DATA.length - 1} />;
                            }}
                            activeDot={<CustomActiveDot />}
                            isAnimationActive={false}
                        />
                        <Line
                            type="linear"
                            dataKey="value3"
                            stroke="#facc15"
                            strokeWidth={2}
                            dot={(props) => {
                                const { key, ...rest } = props;
                                return <CustomDot key={key} {...rest} color="#facc15" lastIndex={COMBINED_CHART_DATA.length - 1} />;
                            }}
                            activeDot={<CustomActiveDot />}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Stats and Filters */}
            <div className="flex items-center justify-between mt-6 px-1 border-t border-gray-50 pt-5">
                {/* Left side: Stats */}
                <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-2">
                        <Trophy className="size-4 text-gray-900" />
                        <span className="text-[13px] font-bold text-black tracking-tight">$205,999,597 Vol</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 opacity-50" />
                        <span className="text-[13px] font-medium text-gray-400">Dec 31, 2026</span>
                    </div>
                </div>

                {/* Right side: Filters & Actions */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3.5 text-[12px] font-bold text-gray-400">
                        {["1H", "6H", "1D", "1W", "1M", "MAX"].map((f) => (
                            <button key={f} className={`hover:text-black transition-colors ${f === "MAX" ? "text-gray-900" : ""}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 border-l border-gray-100 pl-5">
                        <SlidersHorizontal className="size-4 hover:text-black cursor-pointer transition-colors" />
                        <Settings className="size-4 hover:text-black cursor-pointer transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
}
