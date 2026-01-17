import React from 'react';

export default function WireframeCard() {
    // Color Palette from user:
    // Alice Blue: #E9F5FF (Background)
    // Tufts Blue: #468BE6 (Primary Borders/Accents)
    // Cobalt Blue: #1A5799 (Darker Lines/Text)
    // Cool Black: #092F64 (High Contrast Text)
    // Jordy Blue: #93BFEF (Fills/Light Accents)

    return (
        <div className="w-[340px] h-[340px] bg-[#E9F5FF] border border-[#468BE6] relative font-mono text-[#092F64] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center border-b border-[#468BE6] p-6 h-20 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-center w-10 h-10 border border-[#1A5799] text-sm font-bold bg-[#93BFEF]/20 text-[#092F64]">
                    02
                </div>
                <span className="ml-4 tracking-widest text-sm font-bold uppercase text-[#1A5799]">Trusted Data Layer</span>
            </div>

            {/* Main Content Area - Isometric Visualization */}
            <div className="relative h-[180px] w-full flex items-center justify-center p-4 border-b border-[#468BE6] bg-[linear-gradient(rgba(70,139,230,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(70,139,230,0.1)_1px,transparent_1px)] bg-[size:20px_20px]">
                {/* Connection Line Left (Decorative) */}
                <div className="absolute left-6 h-full w-[1px] bg-[#468BE6] top-0"></div>

                {/* Isometric Cube SVG */}
                <div className="relative z-10">
                    <svg width="160" height="140" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Base Grid / Shadow */}
                        <path d="M100 170 L20 130 L100 90 L180 130 Z" stroke="#93BFEF" strokeWidth="1" strokeDasharray="4 4" fill="rgba(147, 191, 239, 0.1)" />

                        {/* Main Cube Structure - Wireframe */}
                        {/* Back Faces (Lighter/Thinner) */}
                        <path d="M20 50 L100 10 L180 50" stroke="#468BE6" strokeWidth="1" />
                        <path d="M100 10 L100 90" stroke="#468BE6" strokeWidth="1" />

                        {/* Front Box (Cobalt Blue Accent with Fill) */}
                        <path d="M60 80 L140 40 L140 120 L60 160 Z" stroke="#1A5799" strokeWidth="1.5" fill="rgba(26, 87, 153, 0.1)" />
                        <path d="M60 80 L60 160" stroke="#1A5799" strokeWidth="1.5" />
                        <path d="M140 40 L60 80" stroke="#1A5799" strokeWidth="1.5" />

                        {/* Modular Grid Lines */}
                        <path d="M100 60 L100 140" stroke="#1A5799" strokeWidth="0.5" strokeDasharray="2 2" />
                        <path d="M60 120 L140 80" stroke="#1A5799" strokeWidth="0.5" strokeDasharray="2 2" />

                        {/* Outer Frame */}
                        <path d="M20 50 L20 130 L100 170 L180 130 L180 50" stroke="#1A5799" strokeWidth="1" />

                        {/* Small floating element */}
                        <rect x="85" y="65" width="20" height="20" transform="rotate(45 95 75)" fill="#468BE6" fillOpacity="0.8" stroke="#1A5799" strokeWidth="1" />
                    </svg>

                    {/* Label Tag */}
                    <div className="absolute top-[60px] -left-12 bg-[#93BFEF] text-[10px] px-1.5 py-0.5 border border-[#1A5799] text-[#092F64] font-bold shadow-sm">
                        4.2MB
                    </div>

                    {/* Connecting line for label */}
                    <div className="absolute top-[68px] -left-4 w-10 h-[1px] bg-[#1A5799] border-b border-dashed"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center h-20 px-6 relative bg-white/30">
                {/* Connection Line Extension */}
                <div className="absolute left-6 h-10 w-[1px] bg-[#468BE6] top-0"></div>
                {/* Horizontal connection */}
                <div className="absolute left-6 top-10 w-4 h-[1px] bg-[#468BE6]"></div>

                <div className="ml-8 flex items-center gap-3">
                    {/* Icon Placeholder */}
                    <div className="w-10 h-10 border border-[#468BE6] flex items-center justify-center bg-white text-[#1A5799]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-lg text-[#092F64] font-bold">Walrus</span>
                </div>
            </div>
        </div>
    );
}
