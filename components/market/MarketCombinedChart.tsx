"use client";

import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy, Clock, Settings, SlidersHorizontal, ChevronDown, Shuffle, ArrowUpDown } from "lucide-react";
import { CombinedChartPoint, CombinedMarketItem } from "@/lib/mock/combined-markets";
import Market3DView from "./Market3DView";


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

const OutcomeSlider = ({ selectedMarkets, currentValues, markets }: { selectedMarkets: Record<string, boolean>; currentValues: Record<string, number>; markets: CombinedMarketItem[] }) => {
    const activeMarkets = markets.filter(m => selectedMarkets[m.id]);

    // Sort markets by value to determine clumping
    const sortedMarkets = [...activeMarkets].sort((a, b) => currentValues[a.id] - currentValues[b.id]);

    // Calculate visual positions with a minimum spread
    const MIN_SPREAD = 7; // Minimum % distance between markers for visual clarity
    const visualPositions: Record<string, number> = {};

    if (sortedMarkets.length > 0) {
        let lastPos = -Infinity;
        sortedMarkets.forEach((m) => {
            const actualValue = currentValues[m.id];
            let visualValue = Math.max(actualValue, lastPos + MIN_SPREAD);

            // Adjust to ensure we don't go beyond 100% or push too far if many clumped
            visualPositions[m.id] = visualValue;
            lastPos = visualValue;
        });

        // If we pushed beyond 100%, we need to push back from the right
        if (lastPos > 100) {
            let nextPos = 100;
            for (let i = sortedMarkets.length - 1; i >= 0; i--) {
                const m = sortedMarkets[i];
                visualPositions[m.id] = Math.min(visualPositions[m.id], nextPos);
                nextPos = visualPositions[m.id] - MIN_SPREAD;
            }
        }
    }

    return (
        <div className="w-full py-20 px-4 select-none max-w-[800px] mx-auto">
            <div className="flex items-center justify-between w-full mb-12">
                <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Outcome</span>
            </div>

            <div className="relative w-full h-1 bg-gray-100 rounded-full">
                {/* Labels at ends */}
                <div className="absolute -top-8 left-0 text-[13px] font-bold text-gray-400 uppercase tracking-wider">No</div>
                <div className="absolute -top-8 right-0 text-[13px] font-bold text-gray-400 uppercase tracking-wider">Yes</div>

                {/* Tick Marks below */}
                <div className="absolute -bottom-6 left-0 text-[11px] font-bold text-gray-300">0%</div>
                <div className="absolute -bottom-6 right-0 text-[11px] font-bold text-gray-300">100%</div>

                {/* Points for each selected market */}
                {activeMarkets.map((m) => {
                    const value = currentValues[m.id];
                    const visualValue = visualPositions[m.id] ?? value;
                    const color = m.id === "m1" ? "#60a5fa" : m.id === "m2" ? "#2563eb" : "#facc15";
                    const shortTitle = MARKET_NAMES[`value${m.id.slice(1)}`];

                    return (
                        <div
                            key={m.id}
                            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out flex flex-col items-center group/marker"
                            style={{ left: `${visualValue}%` }}
                        >
                            {/* Connector line to actual value if offset is significant */}
                            {Math.abs(visualValue - value) > 0.1 && (
                                <div
                                    className="absolute top-0 w-px bg-gray-200 h-4 -translate-y-full"
                                    style={{ left: `${(value - visualValue) * (800 / 100)}px` }}
                                />
                            )}

                            <div
                                className="absolute bottom-6 opacity-0 group-hover/marker:opacity-100 transition-all duration-300 translate-y-2 group-hover/marker:translate-y-0 pointer-events-none z-10"
                            >
                                <div
                                    className="px-2.5 py-1 rounded text-[11px] font-bold text-white whitespace-nowrap shadow-md flex items-center gap-1.5"
                                    style={{ backgroundColor: color }}
                                >
                                    {shortTitle} {value}%
                                </div>
                            </div>

                            <div
                                className="size-4 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform relative z-0"
                                style={{ backgroundColor: color }}
                            />

                            {/* REAL numeric value below it. */}
                            <div className="absolute top-6 text-[13px] font-extrabold tracking-tight whitespace-nowrap" style={{ color }}>
                                {value}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WorldTable = () => {
    const worlds = [
        { state: "000", meaning: "Khamenei No, US No, Israel No", prob: 20.4 },
        { state: "001", meaning: "Khamenei No, US No, Israel Yes", prob: 1.2 },
        { state: "010", meaning: "Khamenei No, US Yes, Israel No", prob: 0.8 },
        { state: "011", meaning: "Khamenei No, US Yes, Israel Yes", prob: 0.6 },
        { state: "100", meaning: "Khamenei Yes, US No, Israel No", prob: 75.2 },
        { state: "101", meaning: "Khamenei Yes, US No, Israel Yes", prob: 1.0 },
        { state: "110", meaning: "Khamenei Yes, US Yes, Israel No", prob: 0.5 },
        { state: "111", meaning: "Khamenei Yes, US Yes, Israel Yes", prob: 0.3 },
    ];

    const colors = ["#60a5fa", "#2563eb", "#facc15"];

    return (
        <div className="w-full max-w-[800px] mx-auto mt-4 px-4 mb-20">
            <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-white/50">
                            <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider w-[100px]">Outcome</th>
                            <th className="px-4 py-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider">Description</th>
                            <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider text-right w-[120px]">Probability</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {worlds.map((w) => (
                            <WorldTableRow key={w.state} world={w} colors={colors} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend for dot indicators */}
            <div className="mt-6 flex items-center justify-center gap-8 px-4 py-3 bg-gray-50/50 rounded-lg border border-gray-100/50">
                <div className="flex items-center gap-2.5">
                    <div className="size-2.5 rounded-full bg-gray-400" />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Filled means Yes</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="size-2.5 rounded-full border border-gray-400" />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Empty means No</span>
                </div>
            </div>
        </div>
    );
};

const WorldTableRow = ({ world, colors }: { world: any, colors: string[] }) => {
    return (
        <tr className="hover:bg-blue-50/10 transition-colors group">
            <td className="px-6 py-4 w-[100px]">
                <div className="flex items-center gap-2">
                    {world.state.split('').map((char: string, idx: number) => (
                        <div
                            key={idx}
                            className="size-2.5 rounded-full border border-current"
                            style={{
                                backgroundColor: char === '1' ? colors[idx] : 'transparent',
                                color: colors[idx],
                                opacity: char === '1' ? 1 : 0.4
                            }}
                        />
                    ))}
                </div>
            </td>
            <td className="px-4 py-4">
                <span className="text-[13px] font-medium text-gray-600">
                    {world.meaning}
                </span>
            </td>
            <td className="px-6 py-4 text-right w-[120px]">
                <span className="font-black text-gray-900 text-[14px]">{world.prob}%</span>
            </td>
        </tr>
    );
};

const ConfusionMatrix = ({ selectedMarkets, markets }: { selectedMarkets: Record<string, boolean>; markets: CombinedMarketItem[] }) => {
    const activeMarkets = markets.filter(m => selectedMarkets[m.id]);

    // State for tracking which market is where
    const [topMarketId, setTopMarketId] = React.useState<string | null>(null);
    const [leftMarketId, setLeftMarketId] = React.useState<string | null>(null);

    // Sync state with selected markets
    React.useEffect(() => {
        const activeIds = activeMarkets.map(m => m.id);
        if (!topMarketId || !activeIds.includes(topMarketId)) {
            setTopMarketId(activeIds[0] || null);
        }
        if (!leftMarketId || !activeIds.includes(leftMarketId) || (leftMarketId === topMarketId && activeIds.length > 1)) {
            const potential = activeIds.find(id => id !== topMarketId);
            setLeftMarketId(potential || activeIds[0] || null);
        }
    }, [selectedMarkets, topMarketId]);

    if (activeMarkets.length < 2) {
        return (
            <div className="flex items-center justify-center min-h-[300px] text-gray-400 font-medium italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mx-4">
                Please select at least 2 markets to view the 2D matrix.
            </div>
        );
    }

    if (!topMarketId || !leftMarketId) return null;

    const mTop = markets.find(m => m.id === topMarketId)!;
    const mLeft = markets.find(m => m.id === leftMarketId)!;

    const mTopName = MARKET_NAMES[`value${mTop.id.slice(1)}`];
    const mLeftName = MARKET_NAMES[`value${mLeft.id.slice(1)}`];

    const mTopColor = mTop.id === "m1" ? "#60a5fa" : mTop.id === "m2" ? "#2563eb" : "#facc15";
    const mLeftColor = mLeft.id === "m1" ? "#60a5fa" : mLeft.id === "m2" ? "#2563eb" : "#facc15";

    const topIdx = parseInt(mTop.id.slice(1)) - 1;
    const leftIdx = parseInt(mLeft.id.slice(1)) - 1;

    const worlds = [
        { state: "000", prob: 20.4 },
        { state: "001", prob: 1.2 },
        { state: "010", prob: 0.8 },
        { state: "011", prob: 0.6 },
        { state: "100", prob: 75.2 },
        { state: "101", prob: 1.0 },
        { state: "110", prob: 0.5 },
        { state: "111", prob: 0.3 },
    ];

    const matrix: any = { "11": 0, "10": 0, "01": 0, "00": 0 };
    worlds.forEach(w => {
        const sTop = w.state[topIdx];
        const sLeft = w.state[leftIdx];
        matrix[`${sTop}${sLeft}`] += w.prob;
    });


    const DiagonalCell = ({ prob, tVal, lVal, lColor, tColor }: { prob: number, tVal: string, lVal: string, lColor: string, tColor: string }) => {
        const isYesYes = tVal === 'YES' && lVal === 'YES';
        const isNoNo = tVal === 'NO' && lVal === 'NO';
        const isDiagonal = isYesYes || isNoNo;

        // Intensity from probability (opacity)
        const probOpacity = 0.08 + (prob / 100) * 0.92;

        // Per-outcome brightness for gradient colors (YES = 100%, NO = 50%)
        const finalLColor = lVal === 'YES' ? lColor : `color-mix(in srgb, ${lColor}, black 50%)`;
        const finalTColor = tVal === 'YES' ? tColor : `color-mix(in srgb, ${tColor}, black 50%)`;

        return (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm group/cell transition-all duration-500 hover:shadow-md hover:scale-[1.01] bg-gray-50/50">
                {/* Smooth Mixed Gradient Background */}
                <div
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{
                        background: `linear-gradient(135deg, ${finalLColor}, ${finalTColor})`,
                        opacity: probOpacity,
                        filter: `saturate(${isDiagonal ? 1.6 : 1})`
                    }}
                />

                {/* Subtle White Glow on Hover */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none" />

                {/* Probability Overlay - Always Black Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-2 text-center">
                    <span className="text-2xl font-black text-gray-900">
                        {prob.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold uppercase text-gray-600 tracking-[0.15em]">
                        {lVal} / {tVal}
                    </span>
                </div>
            </div>
        );
    };

    const handleSwap = () => {
        const temp = topMarketId;
        setTopMarketId(leftMarketId);
        setLeftMarketId(temp);
    };

    const handleShuffleTop = () => {
        const other = activeMarkets.find(m => m.id !== topMarketId && m.id !== leftMarketId);
        if (other) setTopMarketId(other.id);
    };

    const handleShuffleLeft = () => {
        const other = activeMarkets.find(m => m.id !== topMarketId && m.id !== leftMarketId);
        if (other) setLeftMarketId(other.id);
    };

    return (
        <div className="w-full max-w-[900px] mx-auto mt-4 px-4 pb-20 select-none flex flex-col items-center">
            {/* Top Market Name - Centered over everything */}
            <div className="mb-6 flex items-center gap-4">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.25em]">
                    {mTopName}
                </h3>
                <div className="flex items-center gap-3 text-gray-400">
                    <ArrowUpDown
                        className="size-4 cursor-pointer hover:text-blue-500 transition-colors"
                        onClick={handleSwap}
                    />
                    <Shuffle
                        className={`size-4 transition-colors ${activeMarkets.length > 2 ? 'cursor-pointer hover:text-blue-500' : 'opacity-20'}`}
                        onClick={handleShuffleTop}
                    />
                </div>
            </div>

            {/* Matrix Area - Designed to center the grid exactly */}
            <div className="relative flex items-center justify-center" style={{ width: '100%' }}>

                {/* Left Side Group - Correct orientation (Horizontal) */}
                <div className="absolute right-[calc(50%+204px)] flex items-center gap-4 h-[360px] top-[40px]">
                    <div className="flex items-center gap-4 whitespace-nowrap">
                        <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.25em]">
                            {mLeftName}
                        </h3>
                        <div className="flex items-center gap-3 text-gray-400">
                            <ArrowUpDown
                                className="size-4 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={handleSwap}
                            />
                            <Shuffle
                                className={`size-4 transition-colors ${activeMarkets.length > 2 ? 'cursor-pointer hover:text-blue-500' : 'opacity-20'}`}
                                onClick={handleShuffleLeft}
                            />
                        </div>
                    </div>

                    {/* Left YES/NO Row Labels - Colored based on market */}
                    <div className="grid grid-rows-2 gap-4 h-full">
                        <div className="flex items-center justify-center">
                            <span className="text-[13px] font-black tracking-[0.25em]" style={{ color: mLeftColor }}>YES</span>
                        </div>
                        <div className="flex items-center justify-center">
                            <span className="text-[13px] font-black tracking-[0.25em]" style={{ color: `color-mix(in srgb, ${mLeftColor}, black 50%)` }}>NO</span>
                        </div>
                    </div>
                </div>

                {/* Right Side Group - To keep it balanced if needed, but here we just want the grid centered */}
                <div className="flex flex-col items-center">
                    {/* Top YES/NO Column Labels - Colored based on market */}
                    <div className="grid grid-cols-2 mb-6" style={{ width: '360px' }}>
                        <div className="flex justify-center">
                            <span className="text-[13px] font-black tracking-[0.25em]" style={{ color: mTopColor }}>YES</span>
                        </div>
                        <div className="flex justify-center">
                            <span className="text-[13px] font-black tracking-[0.25em]" style={{ color: `color-mix(in srgb, ${mTopColor}, black 50%)` }}>NO</span>
                        </div>
                    </div>

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 overflow-visible" style={{ width: '360px', height: '360px' }}>
                        <DiagonalCell prob={matrix["11"]} tVal="YES" lVal="YES" lColor={mLeftColor} tColor={mTopColor} />
                        <DiagonalCell prob={matrix["10"]} tVal="NO" lVal="YES" lColor={mLeftColor} tColor={mTopColor} />
                        <DiagonalCell prob={matrix["01"]} tVal="YES" lVal="NO" lColor={mLeftColor} tColor={mTopColor} />
                        <DiagonalCell prob={matrix["00"]} tVal="NO" lVal="NO" lColor={mLeftColor} tColor={mTopColor} />
                    </div>
                </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-20 text-center italic font-medium">
                Probabilities derived from the joint-outcome AMM world table.
            </p>
        </div>
    );
};

interface MarketCombinedChartProps {
    data: CombinedChartPoint[];
    markets: CombinedMarketItem[];
    selectedMarkets: Record<string, boolean>;
    view: string;
}

export function MarketCombinedChart({ data, markets, selectedMarkets, view }: MarketCombinedChartProps) {
    const selectedCount = Object.values(selectedMarkets).filter(Boolean).length;

    // Default percentages based on your prompt (or mock)
    const currentValues: Record<string, number> = {
        m1: 77,
        m2: 2.3,
        m3: 1.7
    };

    const availableFilters = ["1H", "6H", "1D"];
    if (selectedCount >= 2) availableFilters.push("2D");
    if (selectedCount === 3) availableFilters.push("3D");
    availableFilters.push("MAX");


    return (
        <div className="w-full flex flex-col">
            <div className="w-full relative min-h-[400px]">
                {view === "Default" && (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                                    position={{ y: 20 }}
                                />
                                {selectedMarkets.m1 && (
                                    <Line
                                        type="linear"
                                        dataKey="value1"
                                        stroke="#60a5fa"
                                        strokeWidth={2}
                                        dot={(props: any) => {
                                            const { key, ...rest } = props;
                                            return <CustomDot key={key} {...rest} color="#60a5fa" lastIndex={data.length - 1} />;
                                        }}
                                        activeDot={<CustomActiveDot />}
                                        isAnimationActive={false}
                                    />
                                )}
                                {selectedMarkets.m2 && (
                                    <Line
                                        type="linear"
                                        dataKey="value2"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={(props: any) => {
                                            const { key, ...rest } = props;
                                            return <CustomDot key={key} {...rest} color="#2563eb" lastIndex={data.length - 1} />;
                                        }}
                                        activeDot={<CustomActiveDot />}
                                        isAnimationActive={false}
                                    />
                                )}
                                {selectedMarkets.m3 && (
                                    <Line
                                        type="linear"
                                        dataKey="value3"
                                        stroke="#facc15"
                                        strokeWidth={2}
                                        dot={(props: any) => {
                                            const { key, ...rest } = props;
                                            return <CustomDot key={key} {...rest} color="#facc15" lastIndex={data.length - 1} />;
                                        }}
                                        activeDot={<CustomActiveDot />}
                                        isAnimationActive={false}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {view === "Table" && <WorldTable />}

                {view === "1D" && (
                    <div className="flex flex-col py-8 pb-12">
                        <OutcomeSlider
                            selectedMarkets={selectedMarkets}
                            currentValues={currentValues}
                            markets={markets}
                        />
                        <p className="text-[11px] text-gray-400 mt-4 text-center italic font-medium px-4">
                            Probabilities derived from the joint-outcome AMM world table.
                        </p>
                    </div>
                )}

                {view === "2D" && (
                    <ConfusionMatrix selectedMarkets={selectedMarkets} markets={markets} />
                )}

                {view === "3D" && (
                    <div className="flex flex-col py-4">
                        <Market3DView />
                        <p className="text-[11px] text-gray-400 mt-12 text-center italic font-medium px-4">
                            Probabilities derived from the joint-outcome AMM world table.
                        </p>
                    </div>
                )}

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
                        {availableFilters.map((f) => (
                            <button key={f} className={`hover:text-black transition-colors ${f === "MAX" || f === "1D" ? "text-gray-900" : ""}`}>
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
