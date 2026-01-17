"use client";

import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy, Clock, Settings, SlidersHorizontal, ChevronDown, Shuffle, ArrowUpDown } from "lucide-react";
import { CombinedChartPoint, CombinedMarketItem, COMBINED_CHART_DATA, COMBINED_MARKETS } from "@/lib/mock/combined-markets";
import Market3DView from "./Market3DView";


const MARKET_NAMES: Record<string, string> = {
    value1: "Khamenei out",
    value2: "US strikes Iran",
    value3: "Israel next strikes",
};

const DEFAULT_PROBS = {
    "000": 2.0, "001": 2.0, "010": 2.0, "011": 88.0,
    "100": 2.0, "101": 2.0, "110": 2.0, "111": 2.0
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

const WorldTable = ({ probabilities }: { probabilities: Record<string, number> }) => {
    // Derive worlds from probabilities prop
    const worlds = [
        { state: "000", meaning: "Khamenei No, US No, Israel No" },
        { state: "001", meaning: "Khamenei No, US No, Israel Yes" },
        { state: "010", meaning: "Khamenei No, US Yes, Israel No" },
        { state: "011", meaning: "Khamenei No, US Yes, Israel Yes" },
        { state: "100", meaning: "Khamenei Yes, US No, Israel No" },
        { state: "101", meaning: "Khamenei Yes, US No, Israel Yes" },
        { state: "110", meaning: "Khamenei Yes, US Yes, Israel No" },
        { state: "111", meaning: "Khamenei Yes, US Yes, Israel Yes" },
    ].map(w => ({
        ...w,
        prob: probabilities[w.state] || 0
    }));

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

const HeatmapColorLegend = () => {
    return (
        <div className="flex flex-col items-center ml-8">
            <div className="flex items-start gap-2">
                {/* Labels on the left */}
                <div className="flex flex-col justify-between h-[280px] text-right">
                    <span className="text-[11px] font-bold text-gray-500">100</span>
                    <span className="text-[11px] font-bold text-gray-500">75</span>
                    <span className="text-[11px] font-bold text-gray-500">50</span>
                    <span className="text-[11px] font-bold text-gray-500">25</span>
                    <span className="text-[11px] font-bold text-gray-500">0</span>
                </div>
                {/* Gradient bar */}
                <div
                    className="w-6 h-[280px] rounded-lg shadow-sm border border-gray-200"
                    style={{
                        background: `linear-gradient(to bottom, #0c4a6e, #0284c7, #38bdf8, #7dd3fc, #e0f2fe)`
                    }}
                />
            </div>
        </div>
    );
};

const ConfusionMatrix = ({ selectedMarkets, marketSelections, onMarketSelectionsChange, probabilities }: {
    selectedMarkets: Record<string, boolean>;
    marketSelections: Record<string, MarketSelection>;
    onMarketSelectionsChange: (selections: Record<string, MarketSelection>) => void;
    probabilities: Record<string, number>;
}) => {
    console.log("ConfusionMatrix probabilities:", probabilities);
    const activeMarkets = COMBINED_MARKETS.filter(m => selectedMarkets[m.id]);

    // State for tracking which market is where
    const [topMarketId, setTopMarketId] = React.useState<string | null>(null);
    const [leftMarketId, setLeftMarketId] = React.useState<string | null>(null);

    // State for tracking which box is currently shining
    const [shiningBox, setShiningBox] = React.useState<string | null>(null);

    // Sync state with selected markets
    React.useEffect(() => {
        const activeIds = activeMarkets.map(m => m.id);
        if (!topMarketId || !activeIds.includes(topMarketId)) {
            setTopMarketId(activeIds[0] || null);
        }
        if (!leftMarketId || !activeIds.includes(leftMarketId) || (leftMarketId === topMarketId && activeIds.length > 1)) {
            const nextId = activeIds.find(id => id !== topMarketId);
            setLeftMarketId(nextId || activeIds[1] || null);
        }
    }, [activeMarkets, topMarketId, leftMarketId]);

    // Auto-shine box based on market selections when switching from 3D
    React.useEffect(() => {
        if (!topMarketId || !leftMarketId) return;

        const topSel = marketSelections[topMarketId];
        const leftSel = marketSelections[leftMarketId];

        // If both top and left markets have yes/no selections, shine the corresponding box
        if (topSel !== null && topSel !== "any" && leftSel !== null && leftSel !== "any") {
            const topLabel = topSel === "yes" ? "Yes" : "No";
            const leftLabel = leftSel === "yes" ? "Yes" : "No";
            const boxId = `${topLabel}${leftLabel}`;
            setShiningBox(boxId);
        } else {
            setShiningBox(null);
        }
    }, [marketSelections, topMarketId, leftMarketId]);

    if (activeMarkets.length < 2) {
        return (
            <div className="flex items-center justify-center min-h-[300px] text-gray-400 font-medium italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mx-4">
                Please select at least 2 markets to view the 2D matrix.
            </div>
        );
    }

    if (!topMarketId || !leftMarketId) return null;

    const mTop = COMBINED_MARKETS.find(m => m.id === topMarketId)!;
    const mLeft = COMBINED_MARKETS.find(m => m.id === leftMarketId)!;

    const mTopName = MARKET_NAMES[`value${mTop.id.slice(1)}`];
    const mLeftName = MARKET_NAMES[`value${mLeft.id.slice(1)}`];

    const topIdx = parseInt(mTop.id.slice(1)) - 1;
    const leftIdx = parseInt(mLeft.id.slice(1)) - 1;

    const worlds = [
        { state: "000" }, { state: "001" }, { state: "010" }, { state: "011" },
        { state: "100" }, { state: "101" }, { state: "110" }, { state: "111" },
    ].map(w => ({
        ...w,
        prob: probabilities[w.state] || 0
    }));

    const matrix: Record<string, number> = { "11": 0, "10": 0, "01": 0, "00": 0 };
    worlds.forEach(w => {
        const sTop = w.state[topIdx];
        const sLeft = w.state[leftIdx];
        matrix[`${sTop}${sLeft}`] += w.prob;
    });

    // Find min and max for color scaling
    const probValues = Object.values(matrix);
    const minProb = Math.min(...probValues);
    const maxProb = Math.max(...probValues);

    // Function to get heatmap color based on probability
    const getHeatmapColor = (prob: number) => {
        // Normalize probability to 0-1 range
        const normalized = maxProb === minProb ? 0.5 : (prob - minProb) / (maxProb - minProb);

        // Color stops from light to dark blue
        const colors = [
            { r: 224, g: 242, b: 254 }, // #e0f2fe - lightest
            { r: 125, g: 211, b: 252 }, // #7dd3fc
            { r: 56, g: 189, b: 248 },  // #38bdf8
            { r: 2, g: 132, b: 199 },   // #0284c7
            { r: 12, g: 74, b: 110 },   // #0c4a6e - darkest
        ];

        // Interpolate between color stops
        const idx = normalized * (colors.length - 1);
        const lowerIdx = Math.floor(idx);
        const upperIdx = Math.ceil(idx);
        const t = idx - lowerIdx;

        const r = Math.round(colors[lowerIdx].r + (colors[upperIdx].r - colors[lowerIdx].r) * t);
        const g = Math.round(colors[lowerIdx].g + (colors[upperIdx].g - colors[lowerIdx].g) * t);
        const b = Math.round(colors[lowerIdx].b + (colors[upperIdx].b - colors[lowerIdx].b) * t);

        return `rgb(${r}, ${g}, ${b})`;
    };

    const HeatmapCell = ({ prob, topLabel, leftLabel }: { prob: number, topLabel: string, leftLabel: string }) => {
        const bgColor = getHeatmapColor(prob);
        // Determine text color based on brightness
        const normalized = maxProb === minProb ? 0.5 : (prob - minProb) / (maxProb - minProb);
        const textColor = normalized > 0.5 ? 'white' : '#1e3a5f';

        const boxId = `${topLabel}${leftLabel}`;
        const isShining = shiningBox === boxId;

        const handleClick = () => {
            if (isShining) {
                setShiningBox(null);
            } else {
                setShiningBox(boxId);

                // Update market selections based on the box clicked
                // topLabel is for topMarketId, leftLabel is for leftMarketId
                const newSelections = { ...marketSelections };

                // Set selections based on box labels (Yes/No)
                if (topMarketId) {
                    newSelections[topMarketId] = topLabel.toLowerCase() as MarketSelection;
                }
                if (leftMarketId) {
                    newSelections[leftMarketId] = leftLabel.toLowerCase() as MarketSelection;
                }

                // Set the third market (not displayed) to null (no selection)
                const allMarketIds = ["m1", "m2", "m3"];
                const thirdMarketId = allMarketIds.find(id => id !== topMarketId && id !== leftMarketId);
                if (thirdMarketId) {
                    newSelections[thirdMarketId] = null;
                }

                onMarketSelectionsChange(newSelections);
            }
        };

        return (
            <div
                className="relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group overflow-hidden"
                style={{ backgroundColor: bgColor }}
                onClick={handleClick}
            >
                {/* Pulsing glow effect from all 4 sides */}
                {isShining && (
                    <>
                        {/* Top glow */}
                        <div
                            className="absolute top-0 left-0 right-0 h-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to bottom, #3b82f6, transparent)'
                            }}
                        />
                        {/* Bottom glow */}
                        <div
                            className="absolute bottom-0 left-0 right-0 h-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to top, #3b82f6, transparent)'
                            }}
                        />
                        {/* Left glow */}
                        <div
                            className="absolute top-0 bottom-0 left-0 w-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to right, #3b82f6, transparent)'
                            }}
                        />
                        {/* Right glow */}
                        <div
                            className="absolute top-0 bottom-0 right-0 w-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to left, #3b82f6, transparent)'
                            }}
                        />
                        {/* Pulsing border */}
                        <div
                            className="absolute inset-0 border-2 rounded"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                borderColor: '#3b82f6',
                                boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), inset 0 0 20px rgba(59, 130, 246, 0.4)'
                            }}
                        />
                    </>
                )}

                <style jsx>{`
                    @keyframes shine-pulse {
                        0%, 100% {
                            opacity: 0.3;
                        }
                        50% {
                            opacity: 1;
                        }
                    }
                `}</style>
                <span
                    className="text-xl font-bold transition-all duration-200 group-hover:scale-110"
                    style={{ color: textColor }}
                >
                    {prob.toFixed(1)}%
                </span>
                <span
                    className="text-[10px] font-medium uppercase tracking-wider mt-1 opacity-80"
                    style={{ color: textColor }}
                >
                    {leftLabel}/{topLabel}
                </span>
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
        <div className="w-full max-w-[900px] mx-auto mt-4 px-4 pb-20 select-none">
            {/* Title Section */}
            <div className="text-center mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Joint Probability Heatmap
                </h3>
                <p className="text-xs text-gray-400">
                    {mTopName} vs {mLeftName}
                </p>
            </div>

            {/* Main Heatmap Container */}
            <div className="flex items-center justify-center gap-4">
                {/* Left Y-axis Label */}
                <div className="flex flex-col items-center justify-center h-[280px] mr-2">
                    <div
                        className="text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        {mLeftName}
                        <div className="flex gap-1">
                            <ArrowUpDown
                                className="size-3 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={handleSwap}
                            />
                            <Shuffle
                                className={`size-3 transition-colors ${activeMarkets.length > 2 ? 'cursor-pointer hover:text-blue-500' : 'opacity-20'}`}
                                onClick={handleShuffleLeft}
                            />
                        </div>
                    </div>
                </div>

                {/* Y-axis Labels */}
                <div className="flex flex-col justify-around h-[280px] mr-3">
                    <span className="text-[11px] font-semibold text-gray-600 py-[60px]">Yes</span>
                    <span className="text-[11px] font-semibold text-gray-600 py-[60px]">No</span>
                </div>

                {/* Heatmap Grid */}
                <div className="flex flex-col">
                    {/* X-axis Label */}
                    <div className="text-center mb-3 flex items-center justify-center gap-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                            {mTopName}
                        </span>
                        <ArrowUpDown
                            className="size-3 cursor-pointer hover:text-blue-500 transition-colors text-gray-400"
                            onClick={handleSwap}
                        />
                        <Shuffle
                            className={`size-3 transition-colors text-gray-400 ${activeMarkets.length > 2 ? 'cursor-pointer hover:text-blue-500' : 'opacity-20'}`}
                            onClick={handleShuffleTop}
                        />
                    </div>

                    {/* X-axis Labels */}
                    <div className="flex justify-around mb-2" style={{ width: '360px' }}>
                        <span className="text-[11px] font-semibold text-gray-600 w-[170px] text-center">Yes</span>
                        <span className="text-[11px] font-semibold text-gray-600 w-[170px] text-center">No</span>
                    </div>

                    {/* 2x2 Grid */}
                    <div
                        className="grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden shadow-md border border-gray-200"
                        style={{ width: '360px', height: '280px' }}
                    >
                        <HeatmapCell prob={matrix["11"]} topLabel="Yes" leftLabel="Yes" />
                        <HeatmapCell prob={matrix["01"]} topLabel="No" leftLabel="Yes" />
                        <HeatmapCell prob={matrix["10"]} topLabel="Yes" leftLabel="No" />
                        <HeatmapCell prob={matrix["00"]} topLabel="No" leftLabel="No" />
                    </div>
                </div>

                {/* Color Legend */}
                <HeatmapColorLegend />
            </div>

            <p className="text-[11px] text-gray-400 mt-12 text-center italic font-medium">
                Probabilities derived from the joint-outcome AMM world table.
            </p>
        </div>
    );
};

type MarketSelection = "yes" | "no" | "any" | null;

interface MarketCombinedChartProps {
    // Optional for backward compatibility (crypto passes these, Iran doesn't)
    data?: CombinedChartPoint[];
    markets?: CombinedMarketItem[];
    selectedMarkets: Record<string, boolean>;
    view: string;
    // New props for Iran (optional for crypto backward compatibility)
    marketSelections?: Record<string, MarketSelection>;
    onMarketSelectionsChange?: (selections: Record<string, MarketSelection>) => void;
    focusedMarket?: string | null;
    onFocusedMarketChange?: (marketId: string | null) => void;
}

export function MarketCombinedChart({ data, selectedMarkets, view, marketSelections, onMarketSelectionsChange, focusedMarket, onFocusedMarketChange, probabilities, markets = COMBINED_MARKETS }: MarketCombinedChartProps & { probabilities?: Record<string, number> }) {
    console.log("MarketCombinedChart probabilities prop:", probabilities);
    const selectedCount = Object.values(selectedMarkets).filter(Boolean).length;

    // Handle line click to focus/unfocus a market
    const handleLineClick = (marketId: string) => {
        if (!onFocusedMarketChange) return;
        if (focusedMarket === marketId) {
            // Clicking same line unfocuses
            onFocusedMarketChange(null);
        } else {
            // Focus on this market
            onFocusedMarketChange(marketId);
        }
    };

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
                            <LineChart data={data || COMBINED_CHART_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                                            return <CustomDot key={key} {...rest} color="#60a5fa" lastIndex={(data || COMBINED_CHART_DATA).length - 1} />;
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
                                            return <CustomDot key={key} {...rest} color="#2563eb" lastIndex={(data || COMBINED_CHART_DATA).length - 1} />;
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
                                            return <CustomDot key={key} {...rest} color="#facc15" lastIndex={(data || COMBINED_CHART_DATA).length - 1} />;
                                        }}
                                        activeDot={<CustomActiveDot />}
                                        isAnimationActive={false}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {view === "Table" && <WorldTable probabilities={probabilities || DEFAULT_PROBS} />}

                {view === "1D" && (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={COMBINED_CHART_DATA}
                                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                onClick={(data) => {
                                    // Handle clicks on the chart - detect which line segment was clicked
                                    if (data && data.activeLabel) {
                                        // Determine which line was closest to the click
                                        const dataPoint = COMBINED_CHART_DATA.find(d => d.date === data.activeLabel);
                                        if (dataPoint && data.activeTooltipIndex !== undefined) {
                                            // Get the active payload to see which line was interacted with
                                            const activePayload = data.activePayload;
                                            if (activePayload && activePayload.length > 0) {
                                                const dataKey = activePayload[0].dataKey;
                                                if (dataKey === 'value1') handleLineClick('m1');
                                                else if (dataKey === 'value2') handleLineClick('m2');
                                                else if (dataKey === 'value3') handleLineClick('m3');
                                            }
                                        }
                                    }
                                }}
                            >
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
                                        stroke={focusedMarket === null || focusedMarket === "m1" ? "#60a5fa" : "#d1d5db"}
                                        strokeWidth={focusedMarket === "m1" ? 3 : 2}
                                        dot={(props: any) => {
                                            const { key, onClick, ...rest } = props;
                                            return (
                                                <g onClick={(e) => { e.stopPropagation(); handleLineClick("m1"); }} style={{ cursor: 'pointer' }}>
                                                    <CustomDot key={key} {...rest} color={focusedMarket === null || focusedMarket === "m1" ? "#60a5fa" : "#d1d5db"} lastIndex={COMBINED_CHART_DATA.length - 1} />
                                                </g>
                                            );
                                        }}
                                        activeDot={(props: any) => (
                                            <g onClick={(e) => { e.stopPropagation(); handleLineClick("m1"); }} style={{ cursor: 'pointer' }}>
                                                <CustomActiveDot {...props} />
                                            </g>
                                        )}
                                        isAnimationActive={false}
                                    />
                                )}
                                {selectedMarkets.m2 && (
                                    <Line
                                        type="linear"
                                        dataKey="value2"
                                        stroke={focusedMarket === null || focusedMarket === "m2" ? "#2563eb" : "#d1d5db"}
                                        strokeWidth={focusedMarket === "m2" ? 3 : 2}
                                        dot={(props: any) => {
                                            const { key, onClick, ...rest } = props;
                                            return (
                                                <g onClick={(e) => { e.stopPropagation(); handleLineClick("m2"); }} style={{ cursor: 'pointer' }}>
                                                    <CustomDot key={key} {...rest} color={focusedMarket === null || focusedMarket === "m2" ? "#2563eb" : "#d1d5db"} lastIndex={COMBINED_CHART_DATA.length - 1} />
                                                </g>
                                            );
                                        }}
                                        activeDot={(props: any) => (
                                            <g onClick={(e) => { e.stopPropagation(); handleLineClick("m2"); }} style={{ cursor: 'pointer' }}>
                                                <CustomActiveDot {...props} />
                                            </g>
                                        )}
                                        isAnimationActive={false}
                                    />
                                )}
                                {selectedMarkets.m3 && (
                                    <Line
                                        type="linear"
                                        dataKey="value3"
                                        stroke={focusedMarket === null || focusedMarket === "m3" ? "#facc15" : "#d1d5db"}
                                        strokeWidth={focusedMarket === "m3" ? 3 : 2}
                                        dot={(props: any) => {
                                            const { key, onClick, ...rest } = props;
                                            return (
                                                <g onClick={(e) => { e.stopPropagation(); handleLineClick("m3"); }} style={{ cursor: 'pointer' }}>
                                                    <CustomDot key={key} {...rest} color={focusedMarket === null || focusedMarket === "m3" ? "#facc15" : "#d1d5db"} lastIndex={COMBINED_CHART_DATA.length - 1} />
                                                </g>
                                            );
                                        }}
                                        activeDot={(props: any) => (
                                            <g onClick={(e) => { e.stopPropagation(); handleLineClick("m3"); }} style={{ cursor: 'pointer' }}>
                                                <CustomActiveDot {...props} />
                                            </g>
                                        )}
                                        isAnimationActive={false}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {view === "2D" && marketSelections && onMarketSelectionsChange && (
                    <ConfusionMatrix
                        selectedMarkets={selectedMarkets}
                        marketSelections={marketSelections}
                        onMarketSelectionsChange={onMarketSelectionsChange}
                        probabilities={probabilities || DEFAULT_PROBS}
                    />
                )}

                {view === "3D" && marketSelections && onMarketSelectionsChange && (
                    <div className="flex flex-col py-4">
                        <Market3DView
                            marketSelections={marketSelections}
                            onMarketSelectionsChange={onMarketSelectionsChange}
                            probabilities={probabilities || undefined}
                        />
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
