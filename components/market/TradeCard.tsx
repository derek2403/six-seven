"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

import { COMBINED_MARKETS } from "@/lib/mock/combined-markets";

export function TradeCard() {
    const [tab, setTab] = React.useState<"buy" | "sell">("buy");
    const [amount, setAmount] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);
    const market = COMBINED_MARKETS[0];

    return (
        <div className="w-full max-w-[320px] bg-white rounded-[20px] border border-gray-100 p-5 sticky top-6">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
                <div className="relative h-10 w-10 flex-shrink-0">
                    <Image
                        src={market.avatar}
                        alt={market.title}
                        fill
                        unoptimized
                        className="rounded-full object-cover border border-gray-100"
                    />
                </div>
                <h2 className="text-[16px] font-bold text-black tracking-tight line-clamp-2 leading-snug">{market.title}</h2>
            </div>

            {/* Tabs & Order Type */}
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-0.5">
                <div className="flex gap-4">
                    <button
                        onClick={() => setTab("buy")}
                        className={`pb-2 text-[15px] font-bold relative transition-colors ${tab === "buy" ? "text-black" : "text-gray-400"}`}
                    >
                        Buy
                        {tab === "buy" && <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-black rounded-full" />}
                    </button>
                    <button
                        onClick={() => setTab("sell")}
                        className={`pb-2 text-[15px] font-bold relative transition-colors ${tab === "sell" ? "text-black" : "text-gray-400"}`}
                    >
                        Sell
                        {tab === "sell" && <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-black rounded-full" />}
                    </button>
                </div>

                <button className="flex items-center gap-1 text-[13px] font-semibold text-gray-900 border-none bg-transparent outline-none">
                    Market <ChevronDown className="size-4 text-gray-400" />
                </button>
            </div>

            {/* Yes/No Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
                <button className="flex items-center justify-center gap-1.5 h-[52px] bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl transition-all">
                    <span className="text-[17px] font-bold">Yes</span>
                    <span className="text-[17px] font-medium opacity-90">58¢</span>
                </button>
                <button className="flex items-center justify-center gap-1.5 h-[52px] bg-[#f1f5f9] hover:bg-[#e2e8f0] text-gray-500 rounded-xl transition-all">
                    <span className="text-[17px] font-bold text-gray-600">No</span>
                    <span className="text-[17px] font-medium">43¢</span>
                </button>
            </div>

            {/* Amount Input */}
            <div className="mb-0.5">
                <div className="flex items-center justify-between h-[40px]">
                    <span className="text-[16px] font-bold text-black uppercase tracking-tight">Amount</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-[36px] font-bold transition-colors leading-none ${(amount || isFocused) ? "text-black" : "text-gray-200"}`}>$</span>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="0"
                                value={amount}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                style={{ width: amount ? `${Math.max(20, amount.length * 22)}px` : '22px' }}
                                className="text-[36px] font-bold text-black border-none focus:ring-0 focus:outline-none p-0 bg-transparent placeholder:text-gray-200 text-right leading-none min-w-[20px] appearance-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex gap-2 justify-end mt-1 mb-3">
                    {["+$1", "+$20", "+$100", "Max"].map((btn) => (
                        <button
                            key={btn}
                            onClick={() => {
                                if (btn === "Max") return;
                                const val = parseInt(btn.replace("+$", ""));
                                setAmount(prev => (parseInt(prev || "0") + val).toString());
                            }}
                            className="px-3 py-1.5 border border-gray-100 rounded-lg text-[12px] font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trade Button */}
            <Button className="w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[16px] font-bold rounded-xl transition-all active:scale-[0.98]">
                Trade
            </Button>
        </div>
    );
}
