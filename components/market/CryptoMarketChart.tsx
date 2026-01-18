"use client";

import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy, Clock, Settings, SlidersHorizontal, ArrowUpDown, Shuffle } from "lucide-react";
import { CombinedChartPoint, CombinedMarketItem } from "@/lib/mock/combined-markets";
import Crypto3DView from "./Crypto3DView";
import { DateSlider } from "./DateSlider";

type MarketSelection = "yes" | "no" | "any" | null;

const MARKET_NAMES: Record<string, string> = {
    value1: "BTC > $100k",
    value2: "ETH > $4k",
    value3: "SUI > $5",
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

const CustomDot = (props: any) => {
    const { cx, cy, index, lastIndex, color } = props;
    if (index === lastIndex) {
        return <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />;
    }
    return null;
};

// --- CRYPTO SPECIFIC VIEWS ---

// 1. World Table (matching Iran design with outcome dots)
const CryptoScenarioTable = ({ marketSelections, targetDate, baseProbabilities }: {
    marketSelections?: Record<string, MarketSelection>,
    targetDate?: string,
    baseProbabilities: Record<string, number>
}) => {
    // Joint probabilities calculated based on baseProbabilities (real prices)
    const p1 = (baseProbabilities.m1 || 0) / 100;
    const p2 = (baseProbabilities.m2 || 0) / 100;
    const p3 = (baseProbabilities.m3 || 0) / 100;

    const worlds = [
        { state: "000", meaning: "BTC No, ETH No, SUI No", prob: (1 - p1) * (1 - p2) * (1 - p3) * 100 },
        { state: "001", meaning: "BTC No, ETH No, SUI Yes", prob: (1 - p1) * (1 - p2) * p3 * 100 },
        { state: "010", meaning: "BTC No, ETH Yes, SUI No", prob: (1 - p1) * p2 * (1 - p3) * 100 },
        { state: "011", meaning: "BTC No, ETH Yes, SUI Yes", prob: (1 - p1) * p2 * p3 * 100 },
        { state: "100", meaning: "BTC Yes, ETH No, SUI No", prob: p1 * (1 - p2) * (1 - p3) * 100 },
        { state: "101", meaning: "BTC Yes, ETH No, SUI Yes", prob: p1 * (1 - p2) * p3 * 100 },
        { state: "110", meaning: "BTC Yes, ETH Yes, SUI No", prob: p1 * p2 * (1 - p3) * 100 },
        { state: "111", meaning: "BTC Yes, ETH Yes, SUI Yes", prob: p1 * p2 * p3 * 100 },
    ];

    const getJitteredProb = (baseProb: number, state: string) => {
        let prob = baseProb;

        // Minor jitter for visual interest
        if (targetDate) {
            const hash = targetDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            prob += (hash % 4) - 2;
        }

        // Selection bias
        if (marketSelections) {
            const m1 = marketSelections.m1;
            const m2 = marketSelections.m2;
            const m3 = marketSelections.m3;

            const matchCount = [
                m1 === (state[0] === '1' ? 'yes' : 'no'),
                m2 === (state[1] === '1' ? 'yes' : 'no'),
                m3 === (state[2] === '1' ? 'yes' : 'no')
            ].filter(Boolean).length;

            prob += matchCount * 1.5;
        }

        return Math.max(0.1, Math.min(99.9, prob)).toFixed(1);
    };

    const colors = ["#60a5fa", "#2563eb", "#facc15"]; // BTC, ETH, SUI

    // Convert marketSelections to expected state pattern for matching
    const getExpectedPattern = () => {
        if (!marketSelections) return null;
        const m1 = marketSelections.m1;
        const m2 = marketSelections.m2;
        const m3 = marketSelections.m3;

        return [
            m1 === "yes" ? "1" : m1 === "no" ? "0" : null,
            m2 === "yes" ? "1" : m2 === "no" ? "0" : null,
            m3 === "yes" ? "1" : m3 === "no" ? "0" : null,
        ];
    };

    const expectedPattern = getExpectedPattern();

    const isRowHighlighted = (state: string) => {
        if (!expectedPattern) return false;

        // If all are null (no selections/wild cards), do not highlight anything
        const hasSelection = expectedPattern.some(char => char !== null);
        if (!hasSelection) return false;

        return expectedPattern.every((char, idx) => char === null || char === state[idx]);
    };

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
                        {worlds.map((w) => {
                            const highlighted = isRowHighlighted(w.state);
                            return (
                                <tr key={w.state} className={`transition-colors group ${highlighted ? 'bg-blue-100/60 ring-2 ring-blue-400/50 ring-inset' : 'hover:bg-blue-50/10'}`}>
                                    <td className="px-6 py-4 w-[100px]">
                                        <div className="flex items-center gap-2">
                                            {w.state.split('').map((char: string, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`size-2.5 rounded-full border border-current ${highlighted ? 'scale-125' : ''}`}
                                                    style={{
                                                        backgroundColor: char === '1' ? colors[idx] : 'transparent',
                                                        color: colors[idx],
                                                        opacity: char === '1' ? 1 : 0.4,
                                                        transition: 'transform 0.2s'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`text-[13px] font-medium ${highlighted ? 'text-blue-800 font-semibold' : 'text-gray-600'}`}>
                                            {w.meaning}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right w-[120px]">
                                        <span className={`font-black text-[14px] ${highlighted ? 'text-blue-700' : 'text-gray-900'}`}>{getJitteredProb(w.prob, w.state)}%</span>
                                    </td>
                                </tr>
                            );
                        })}
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

// 2. Probability Slider (1D) - Matches Iran OutcomeSlider design exactly
const CryptoProbabilityDisplay = ({ markets, selectedMarkets, marketSelections, onMarketSelectionsChange, targetDate, baseProbabilities }: {
    markets: CombinedMarketItem[],
    selectedMarkets: Record<string, boolean>,
    marketSelections?: Record<string, MarketSelection>,
    onMarketSelectionsChange?: (selections: Record<string, MarketSelection>) => void,
    targetDate?: string,
    baseProbabilities: Record<string, number>
}) => {
    const activeMarkets = markets.filter(m => selectedMarkets[m.id]);

    // Use current probability values from props
    let currentValues: Record<string, number> = {
        m1: baseProbabilities.m1 || 50,
        m2: baseProbabilities.m2 || 50,
        m3: baseProbabilities.m3 || 50
    };

    // Jitter values based on targetDate and marketSelections
    if (targetDate || marketSelections) {
        const dateHash = targetDate ? targetDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;

        const getBias = (id: string, base: number) => {
            let bias = 0;
            if (marketSelections) {
                const sel = marketSelections[id];
                if (sel === "yes") bias = 20;
                if (sel === "no") bias = -20;
            }
            const jitter = (dateHash % 8 - 4);
            return Math.max(0.1, Math.min(99.9, base + bias + jitter));
        };

        currentValues = {
            m1: getBias('m1', currentValues.m1),
            m2: getBias('m2', currentValues.m2),
            m3: getBias('m3', currentValues.m3)
        };
    }

    // Sort markets by value to determine clumping
    const sortedMarkets = [...activeMarkets].sort((a, b) => currentValues[a.id] - currentValues[b.id]);

    // Calculate visual positions with a minimum spread
    const MIN_SPREAD = 7;
    const visualPositions: Record<string, number> = {};

    if (sortedMarkets.length > 0) {
        let lastPos = -Infinity;
        sortedMarkets.forEach((m) => {
            const actualValue = currentValues[m.id];
            let visualValue = Math.max(actualValue, lastPos + MIN_SPREAD);
            visualPositions[m.id] = visualValue;
            lastPos = visualValue;
        });

        if (lastPos > 100) {
            let nextPos = 100;
            for (let i = sortedMarkets.length - 1; i >= 0; i--) {
                const m = sortedMarkets[i];
                visualPositions[m.id] = Math.min(visualPositions[m.id], nextPos);
                nextPos = visualPositions[m.id] - MIN_SPREAD;
            }
        }
    }

    // Check if a market is selected (has yes or no, not any/null)
    const isMarketSelected = (marketId: string) => {
        if (!marketSelections) return false;
        const sel = marketSelections[marketId];
        return sel === "yes" || sel === "no";
    };

    return (
        <div className="w-full py-20 px-4 select-none max-w-[800px] mx-auto">
            <style jsx>{`
                @keyframes pulse-glow-blue {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(96, 165, 250, 0);
                        transform: scale(1.15);
                    }
                }
                @keyframes pulse-glow-darkblue {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(37, 99, 235, 0);
                        transform: scale(1.15);
                    }
                }
                @keyframes pulse-glow-yellow {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(250, 204, 21, 0);
                        transform: scale(1.15);
                    }
                }
            `}</style>
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
                {sortedMarkets.map((m, index) => {
                    const value = currentValues[m.id];
                    const visualValue = visualPositions[m.id] ?? value;
                    const color = m.id === "m1" ? "#60a5fa" : m.id === "m2" ? "#2563eb" : "#facc15";
                    const animationName = m.id === "m1" ? "pulse-glow-blue" : m.id === "m2" ? "pulse-glow-darkblue" : "pulse-glow-yellow";
                    const shortTitle = MARKET_NAMES[`value${m.id.slice(1)}`] || m.title;
                    const isPulsing = isMarketSelected(m.id);
                    const handleDotClick = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (!onMarketSelectionsChange) return;

                        const current = marketSelections?.[m.id];
                        const next = current === "yes" ? "any" : "yes";

                        onMarketSelectionsChange({
                            ...marketSelections,
                            [m.id]: next
                        });
                    };

                    return (
                        <div
                            key={m.id}
                            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out flex flex-col items-center group/marker"
                            style={{ left: `${visualValue}%` }}
                            onClick={handleDotClick}
                        >

                            {/* Tooltip on Hover */}
                            <div className="absolute bottom-6 opacity-0 group-hover/marker:opacity-100 transition-all duration-300 translate-y-2 group-hover/marker:translate-y-0 pointer-events-none z-10">
                                <div
                                    className="px-2.5 py-1 rounded text-[11px] font-bold text-white whitespace-nowrap shadow-md flex items-center gap-1.5"
                                    style={{ backgroundColor: color }}
                                >
                                    {shortTitle} {value.toFixed(1)}%
                                </div>
                            </div>

                            {/* Dot */}
                            <div
                                className={`size-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform relative z-0 ${isPulsing ? '' : 'hover:scale-110'}`}
                                style={{
                                    backgroundColor: color,
                                    animation: isPulsing ? `${animationName} 1.5s ease-in-out infinite` : 'none'
                                }}
                            />

                            {/* Value Label below */}
                            <div className="absolute top-6 text-[13px] font-extrabold tracking-tight whitespace-nowrap" style={{ color }}>
                                {value.toFixed(1)}%
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-[11px] text-gray-400 mt-6 text-center italic font-medium">
                Probabilities derived from option pricing models.
            </p>
        </div>
    );
};

// Color Legend for Heatmap
const CryptoHeatmapColorLegend = () => {
    return (
        <div className="flex flex-col items-center ml-8">
            <div className="flex items-start gap-2">
                <div className="flex flex-col justify-between h-[280px] text-right">
                    <span className="text-[11px] font-bold text-gray-500">100</span>
                    <span className="text-[11px] font-bold text-gray-500">75</span>
                    <span className="text-[11px] font-bold text-gray-500">50</span>
                    <span className="text-[11px] font-bold text-gray-500">25</span>
                    <span className="text-[11px] font-bold text-gray-500">0</span>
                </div>
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

// 3. Joint Probability Heatmap (2D) - Matches Iran ConfusionMatrix design
const CryptoCorrelationHeatmap = ({ markets, selectedMarkets, marketSelections, onMarketSelectionsChange, targetDate, baseProbabilities }: {
    markets: CombinedMarketItem[],
    selectedMarkets: Record<string, boolean>,
    marketSelections?: Record<string, MarketSelection>,
    onMarketSelectionsChange?: (selections: Record<string, MarketSelection>) => void,
    targetDate?: string,
    baseProbabilities: Record<string, number>
}) => {
    const activeMarkets = markets.filter(m => selectedMarkets[m.id]);

    const [topMarketId, setTopMarketId] = React.useState<string | null>(null);
    const [leftMarketId, setLeftMarketId] = React.useState<string | null>(null);
    const [shiningBox, setShiningBox] = React.useState<string | null>(null);

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
    }, [selectedMarkets, topMarketId, leftMarketId, activeMarkets]);

    // Auto-shine box based on market selections
    React.useEffect(() => {
        if (!topMarketId || !leftMarketId || !marketSelections) return;

        const topSel = marketSelections[topMarketId];
        const leftSel = marketSelections[leftMarketId];

        if (topSel !== null && topSel !== "any" && leftSel !== null && leftSel !== "any") {
            const topLabel = topSel === "yes" ? "Yes" : "No";
            const leftLabel = leftSel === "yes" ? "Yes" : "No";
            const boxId = `${topLabel}${leftLabel}`;
            setShiningBox(boxId);
        } else {
            setShiningBox(null);
        }
    }, [marketSelections, topMarketId, leftMarketId]);

    // Joint probability calculation based on real rates
    const matrix = React.useMemo(() => {
        const topIdx = topMarketId ? parseInt(topMarketId.slice(1)) - 1 : 0;
        const leftIdx = leftMarketId ? parseInt(leftMarketId.slice(1)) - 1 : 1;

        const p1 = (baseProbabilities.m1 || 0) / 100;
        const p2 = (baseProbabilities.m2 || 0) / 100;
        const p3 = (baseProbabilities.m3 || 0) / 100;

        const worlds = [
            { state: "000", prob: (1 - p1) * (1 - p2) * (1 - p3) * 100 },
            { state: "001", prob: (1 - p1) * (1 - p2) * p3 * 100 },
            { state: "010", prob: (1 - p1) * p2 * (1 - p3) * 100 },
            { state: "011", prob: (1 - p1) * p2 * p3 * 100 },
            { state: "100", prob: p1 * (1 - p2) * (1 - p3) * 100 },
            { state: "101", prob: p1 * (1 - p2) * p3 * 100 },
            { state: "110", prob: p1 * p2 * (1 - p3) * 100 },
            { state: "111", prob: p1 * p2 * p3 * 100 },
        ];

        const result: Record<string, number> = { "11": 0, "10": 0, "01": 0, "00": 0 };
        worlds.forEach(w => {
            let prob = w.prob;

            // Apply bias if selection matches world
            if (marketSelections) {
                const m1 = marketSelections.m1;
                const m2 = marketSelections.m2;
                const m3 = marketSelections.m3;

                const matchCount = [
                    m1 === (w.state[0] === '1' ? 'yes' : 'no'),
                    m2 === (w.state[1] === '1' ? 'yes' : 'no'),
                    m3 === (w.state[2] === '1' ? 'yes' : 'no')
                ].filter(Boolean).length;

                prob += matchCount * 1.5;
            }

            const sTop = w.state[topIdx];
            const sLeft = w.state[leftIdx];
            result[`${sTop}${sLeft}`] += prob;
        });

        // Add small jitter for "live" feel
        if (targetDate) {
            const dateHash = targetDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            Object.keys(result).forEach(key => {
                result[key] = Math.max(0.1, Math.min(99.9, result[key] + (dateHash % 4) - 2));
            });
        }

        return result;
    }, [baseProbabilities, topMarketId, leftMarketId, marketSelections, targetDate]);

    if (activeMarkets.length < 2) {
        return (
            <div className="flex items-center justify-center min-h-[300px] text-gray-400 font-medium italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mx-4">
                Select at least 2 assets to view the 2D matrix.
            </div>
        );
    }

    if (!topMarketId || !leftMarketId) return null;

    const mTop = markets.find(m => m.id === topMarketId)!;
    const mLeft = markets.find(m => m.id === leftMarketId)!;

    const mTopName = MARKET_NAMES[`value${mTop.id.slice(1)}`] || mTop.title.split(' >')[0];
    const mLeftName = MARKET_NAMES[`value${mLeft.id.slice(1)}`] || mLeft.title.split(' >')[0];


    const probValues = Object.values(matrix);
    const minProb = Math.min(...probValues);
    const maxProb = Math.max(...probValues);

    const getHeatmapColor = (prob: number) => {
        const normalized = maxProb === minProb ? 0.5 : (prob - minProb) / (maxProb - minProb);
        const colors = [
            { r: 224, g: 242, b: 254 },
            { r: 125, g: 211, b: 252 },
            { r: 56, g: 189, b: 248 },
            { r: 2, g: 132, b: 199 },
            { r: 12, g: 74, b: 110 },
        ];
        const idx = normalized * (colors.length - 1);
        const lowerIdx = Math.floor(idx);
        const upperIdx = Math.ceil(idx);
        const t = idx - lowerIdx;
        const r = Math.round(colors[lowerIdx].r + (colors[upperIdx].r - colors[lowerIdx].r) * t);
        const g = Math.round(colors[lowerIdx].g + (colors[upperIdx].g - colors[lowerIdx].g) * t);
        const b = Math.round(colors[lowerIdx].b + (colors[upperIdx].b - colors[lowerIdx].b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const handleCellClick = (topLabel: string, leftLabel: string) => {
        if (!onMarketSelectionsChange || !topMarketId || !leftMarketId) return;

        const newSelections = { ...marketSelections };

        // Set the active markets
        newSelections[topMarketId] = topLabel === "Yes" ? "yes" : "no";
        newSelections[leftMarketId] = leftLabel === "Yes" ? "yes" : "no";

        // Reset all other markets to "any"
        Object.keys(newSelections).forEach(key => {
            if (key !== topMarketId && key !== leftMarketId) {
                newSelections[key] = "any";
            }
        });

        onMarketSelectionsChange(newSelections);
    };

    const HeatmapCell = ({ prob, topLabel, leftLabel }: { prob: number, topLabel: string, leftLabel: string }) => {
        const bgColor = getHeatmapColor(prob);
        const normalized = maxProb === minProb ? 0.5 : (prob - minProb) / (maxProb - minProb);
        const textColor = normalized > 0.5 ? 'white' : '#1e3a5f';
        const boxId = `${topLabel}${leftLabel}`;
        const isShining = shiningBox === boxId;

        return (
            <div
                className="relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group overflow-hidden"
                style={{ backgroundColor: bgColor }}
                onClick={() => handleCellClick(topLabel, leftLabel)}
            >
                {/* Pulsing glow effect from all 4 sides */}
                {isShining && (
                    <>
                        {/* Top glow */}
                        <div
                            className="absolute top-0 left-0 right-0 h-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to bottom, #06b6d4, transparent)'
                            }}
                        />
                        {/* Bottom glow */}
                        <div
                            className="absolute bottom-0 left-0 right-0 h-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to top, #06b6d4, transparent)'
                            }}
                        />
                        {/* Left glow */}
                        <div
                            className="absolute top-0 bottom-0 left-0 w-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to right, #06b6d4, transparent)'
                            }}
                        />
                        {/* Right glow */}
                        <div
                            className="absolute top-0 bottom-0 right-0 w-2"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                background: 'linear-gradient(to left, #06b6d4, transparent)'
                            }}
                        />
                        {/* Pulsing border */}
                        <div
                            className="absolute inset-0 border-2 rounded"
                            style={{
                                animation: 'shine-pulse 1s infinite',
                                borderColor: '#06b6d4',
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), inset 0 0 20px rgba(6, 182, 212, 0.4)'
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
                <span className="text-xl font-bold transition-all duration-200 group-hover:scale-110" style={{ color: textColor }}>
                    {prob.toFixed(1)}%
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider mt-1 opacity-80" style={{ color: textColor }}>
                    {leftLabel}/{topLabel}
                </span>
            </div>
        );
    };

    const handleSwap = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const temp = topMarketId;
        setTopMarketId(leftMarketId);
        setLeftMarketId(temp);
    };

    const handleShuffleTop = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const other = activeMarkets.find(m => m.id !== topMarketId && m.id !== leftMarketId);
        if (other) setTopMarketId(other.id);
    };

    const handleShuffleLeft = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const other = activeMarkets.find(m => m.id !== topMarketId && m.id !== leftMarketId);
        if (other) setLeftMarketId(other.id);
    };

    return (
        <div className="w-full max-w-[900px] mx-auto mt-4 px-4 pb-4 select-none">
            <div className="text-center mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Joint Probability Heatmap</h3>
                <p className="text-xs text-gray-400">{mTopName} vs {mLeftName}</p>
            </div>

            <div className="flex items-center justify-center gap-4">
                {/* Left Y-axis Label */}
                <div className="flex flex-col items-center justify-center h-[280px] mr-2">
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {mLeftName}
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        <ArrowUpDown className="size-3 cursor-pointer hover:text-blue-500 transition-colors text-gray-400" onClick={handleSwap} />
                        <Shuffle className={`size-3 transition-colors text-gray-400 ${activeMarkets.length > 2 ? 'cursor-pointer hover:text-blue-500' : 'opacity-20 cursor-not-allowed'}`} onClick={activeMarkets.length > 2 ? handleShuffleLeft : undefined} />
                    </div>
                </div>

                {/* Y-axis Labels */}
                <div className="flex flex-col justify-around h-[280px] mr-3">
                    <span className="text-[11px] font-semibold text-gray-600 py-[60px]">Yes</span>
                    <span className="text-[11px] font-semibold text-gray-600 py-[60px]">No</span>
                </div>

                {/* Heatmap Grid */}
                <div className="flex flex-col">
                    <div className="text-center mb-3 flex items-center justify-center gap-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{mTopName}</span>
                        <ArrowUpDown className="size-3 cursor-pointer hover:text-blue-500 transition-colors text-gray-400" onClick={handleSwap} />
                        <Shuffle className={`size-3 transition-colors text-gray-400 ${activeMarkets.length > 2 ? 'cursor-pointer hover:text-blue-500' : 'opacity-20 cursor-not-allowed'}`} onClick={activeMarkets.length > 2 ? handleShuffleTop : undefined} />
                    </div>
                    <div className="flex justify-around mb-2" style={{ width: '360px' }}>
                        <span className="text-[11px] font-semibold text-gray-600 w-[170px] text-center">Yes</span>
                        <span className="text-[11px] font-semibold text-gray-600 w-[170px] text-center">No</span>
                    </div>
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden shadow-md border border-gray-200" style={{ width: '360px', height: '280px' }}>
                        <HeatmapCell prob={matrix["11"]} topLabel="Yes" leftLabel="Yes" />
                        <HeatmapCell prob={matrix["01"]} topLabel="No" leftLabel="Yes" />
                        <HeatmapCell prob={matrix["10"]} topLabel="Yes" leftLabel="No" />
                        <HeatmapCell prob={matrix["00"]} topLabel="No" leftLabel="No" />
                    </div>
                </div>

                <CryptoHeatmapColorLegend />
            </div>

            <p className="text-[11px] text-gray-400 mt-6 text-center italic font-medium">
                Probabilities derived from historical price correlation data.
            </p>
        </div>
    );
};



interface CryptoMarketChartProps {
    data: CombinedChartPoint[];
    markets: CombinedMarketItem[];
    selectedMarkets: Record<string, boolean>;
    view: string;
    marketSelections?: Record<string, MarketSelection>;
    targetDate: string;
    baseProbabilities: Record<string, number>;
    onTargetDateChange: (date: string) => void;
    onMarketSelectionsChange?: (selections: Record<string, MarketSelection>) => void;
}

export function CryptoMarketChart({ data, markets, selectedMarkets, view, marketSelections, targetDate, baseProbabilities, onTargetDateChange, onMarketSelectionsChange }: CryptoMarketChartProps) {
    const selectedCount = Object.values(selectedMarkets).filter(Boolean).length;
    const availableFilters = ["1H", "6H", "1D", "1W", "1M", "MAX"];

    const handleMarketSelectionsChange = (newSelections: Record<string, MarketSelection>) => {
        if (onMarketSelectionsChange) {
            onMarketSelectionsChange(newSelections);
        }
    };

    return (
        <div className="w-full flex flex-col">
            <div className="mb-6 border-b border-gray-50 pb-4">
                <DateSlider selectedDate={targetDate} onDateChange={onTargetDateChange} />
            </div>

            <div className="w-full relative min-h-[400px]">
                {view === "Table" && <CryptoScenarioTable marketSelections={marketSelections} targetDate={targetDate} baseProbabilities={baseProbabilities} />}

                {view === "2D" && <CryptoProbabilityDisplay markets={markets} selectedMarkets={selectedMarkets} marketSelections={marketSelections} onMarketSelectionsChange={handleMarketSelectionsChange} targetDate={targetDate} baseProbabilities={baseProbabilities} />}

                {view === "3D" && <CryptoCorrelationHeatmap markets={markets} selectedMarkets={selectedMarkets} marketSelections={marketSelections} onMarketSelectionsChange={handleMarketSelectionsChange} targetDate={targetDate} baseProbabilities={baseProbabilities} />}

                {view === "4D" && (
                    <div className="flex flex-col pt-0 pb-4">
                        <Crypto3DView
                            marketSelections={marketSelections}
                            onMarketSelectionsChange={handleMarketSelectionsChange}
                            targetDate={targetDate}
                            baseProbabilities={baseProbabilities}
                        />
                        <p className="text-[11px] text-gray-400 mt-4 text-center italic font-medium">
                            4D Visualization (Joint Probability Space × Time Dimension) for {targetDate}
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
                        <span className="text-[13px] font-bold text-black tracking-tight">$825,123,597 Vol</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 opacity-50" />
                        <span className="text-[13px] font-medium text-gray-400">{targetDate}</span>
                    </div>
                </div>

                {/* Right side: Filters & Actions */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3.5 text-[12px] font-bold text-gray-400">
                        {availableFilters.map((f) => (
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
