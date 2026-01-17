"use client";

import { cn } from "../lib/utils";
import { AnimatedList } from "./AnimatedList";

interface Item {
    name: string;
    description: string;
    value: string;
    code: string;
}

let notifications = [
    {
        name: "DATA UPLINK ESTABLISHED",
        description: "Connection verified",
        value: "4.2 MB",
        code: "CONN_01",
    },
    {
        name: "SECURE PACKET RECEIVED",
        description: "Encryption: AES-256",
        value: "128 KB",
        code: "PKT_84",
    },
    {
        name: "NODE SYNCHRONIZATION",
        description: "Latency: 12ms",
        value: "SYNC_OK",
        code: "NODE_09",
    },
    {
        name: "SYSTEM INTEGRITY CHECK",
        description: "Status: Optimal",
        value: "100%",
        code: "SYS_CHK",
    },
];

notifications = Array.from({ length: 10 }, () => notifications).flat();

const DataLogEntry = ({ name, description, value, code }: Item) => {
    return (
        <div
            className={cn(
                "relative mx-auto w-full max-w-[400px] cursor-pointer overflow-hidden mb-2",
                "bg-[#468BE6]/5 border border-[#468BE6] transition-all duration-200 ease-in-out hover:bg-[#468BE6]/10",
            )}
        >
            <div className="flex flex-row items-center gap-3 p-3">
                {/* Tech Icon / Code Box */}
                <div className="flex flex-col items-center justify-center w-12 h-12 border border-[#1A5799] bg-[#93BFEF]/20">
                    <span className="text-[10px] font-bold text-[#1A5799]">{code.split('_')[0]}</span>
                    <div className="w-full h-[1px] bg-[#1A5799] my-0.5"></div>
                    <span className="text-[10px] text-[#092F64]">{code.split('_')[1] || '00'}</span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 overflow-hidden font-mono">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-bold text-[#092F64] tracking-wider">{name}</span>
                        <span className="text-xs font-bold text-[#1A5799] bg-[#E9F5FF] px-1 border border-[#468BE6]">{value}</span>
                    </div>
                    <p className="text-[10px] text-[#1A5799] mt-1 uppercase tracking-tight">
                        {'>'} {description}
                    </p>
                </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#1A5799]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#1A5799]"></div>
        </div>
    );
};

export function AnimatedListDemo({
    className,
}: {
    className?: string;
}) {
    return (
        <div
            className={cn(
                "relative flex h-[480px] w-full flex-col overflow-hidden shadow-2xl pl-12",
                "text-[#092F64] font-mono",
                className,
            )}
        >
            {/* Schematic Lines (The "Isometric" Border feel) */}
            {/* 1. Main Vertical Data Bus Line */}
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-[#468BE6] z-20"></div>

            {/* 2. Top Horizontal Connector */}
            <div className="absolute left-6 top-8 w-6 h-[1px] bg-[#468BE6] z-20"></div>

            {/* 3. Bottom Horizontal Connector */}
            <div className="absolute left-6 bottom-8 w-6 h-[1px] bg-[#468BE6] z-20"></div>

            {/* Main Content Container (The "Card") */}
            <div className="relative flex-1 flex flex-col bg-[#E9F5FF] border border-[#468BE6] overflow-hidden z-10 w-full">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#468BE6] p-4 bg-white/40 h-14 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 border border-[#1A5799] bg-[#93BFEF]/20">
                            <div className="w-2 h-2 bg-[#1A5799]"></div>
                        </div>
                        <span className="text-sm font-bold tracking-widest uppercase text-[#1A5799]">Live Data Feed</span>
                    </div>
                    <div className="flex gap-1.5 opacity-80">
                        <div className="w-1 h-1 rounded-full bg-[#1A5799] animate-pulse"></div>
                        <div className="w-1 h-1 rounded-full bg-[#1A5799]"></div>
                        <div className="w-1 h-1 rounded-full bg-[#1A5799]"></div>
                    </div>
                </div>

                {/* Grid Background */}
                <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(70,139,230,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(70,139,230,0.05)_1px,transparent_1px)] bg-[size:15px_15px]"></div>

                {/* List Content */}
                <div className="relative z-10 p-4 h-full overflow-hidden">
                    <AnimatedList>
                        {notifications.map((item, idx) => (
                            <DataLogEntry {...item} key={idx} />
                        ))}
                    </AnimatedList>
                </div>

                {/* Corner Accents (Technical) */}
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#1A5799]"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#1A5799]"></div>
            </div>

            {/* Floating Label (Like in WireframeCard) */}
            <div className="absolute top-20 left-0 bg-[#092F64] text-white text-[9px] px-1 py-0.5 z-30 font-bold">
                SYS_LOG
            </div>
        </div>
    );
}
