"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface DateSliderProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
}

const DATES = [
    "Jan 15, 2026", "Jan 20, 2026", "Jan 25, 2026", "Jan 31, 2026",
    "Feb 05, 2026", "Feb 10, 2026", "Feb 15, 2026", "Feb 20, 2026", "Feb 28, 2026",
    "Mar 05, 2026", "Mar 10, 2026", "Mar 15, 2026", "Mar 20, 2026", "Mar 31, 2026",
    "Apr 15, 2026", "May 15, 2026", "Jun 15, 2026", "Jul 15, 2026", "Aug 15, 2026",
    "Sep 15, 2026", "Oct 15, 2026", "Nov 15, 2026", "Dec 15, 2026", "Dec 31, 2026"
];

export function DateSlider({ selectedDate, onDateChange }: DateSliderProps) {
    const currentIndex = DATES.indexOf(selectedDate);
    const progress = (currentIndex / (DATES.length - 1)) * 100;

    return (
        <div className="w-full pt-2 pb-8 px-2">
            <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col">
                    <span className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Time Dimension</span>
                    <span className="text-[24px] font-black text-black tracking-tight">{selectedDate}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Live Horizon</span>
                </div>
            </div>

            <div className="relative h-12 flex items-center group">
                {/* Track Background */}
                <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />

                {/* Active Track */}
                <div
                    className="absolute h-1.5 bg-black rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />

                {/* Markers */}
                <div className="absolute inset-x-0 flex justify-between px-0.5">
                    {DATES.map((_, i) => (
                        i % 5 === 0 && (
                            <div key={i} className="flex flex-col items-center">
                                <div className={cn(
                                    "h-2 w-0.5 rounded-full transition-colors duration-300",
                                    i <= currentIndex ? "bg-black" : "bg-gray-200"
                                )} />
                            </div>
                        )
                    ))}
                </div>

                {/* Range Input */}
                <input
                    type="range"
                    min="0"
                    max={DATES.length - 1}
                    value={currentIndex}
                    onChange={(e) => onDateChange(DATES[parseInt(e.target.value)])}
                    className="absolute inset-x-0 w-full h-12 opacity-0 cursor-pointer z-20"
                />

                {/* Custom Thumb */}
                <div
                    className="absolute size-8 bg-black rounded-full border-[3px] border-white shadow-xl flex items-center justify-center pointer-events-none z-10 transition-all duration-300 ease-out hover:scale-110"
                    style={{ left: `calc(${progress}% - 16px)` }}
                >
                    <div className="size-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </div>
            </div>

            <div className="flex justify-between mt-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Early 2026</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center italic">Slide to view market probabilities at different horizons</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Late 2026</span>
            </div>

            <style jsx>{`
                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 32px;
                    height: 32px;
                }
            `}</style>
        </div>
    );
}
