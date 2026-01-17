"use client";

import React, { useState, useMemo } from "react";
import { Globe } from "@/components/ui/globe";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { cn } from "@/lib/utils";

const MARKETS = {
  US: [
    { name: "Fed rate cut in Feb?", description: "High conviction among analysts.", time: "2m ago", icon: "🇺🇸", color: "#468BE6" },
    { name: "S&P 500 above 6000?", description: "Market sentiment is bullish.", time: "10m ago", icon: "📈", color: "#468BE6" },
    { name: "US Tech Regulation Bill?", description: "Senate vote expected soon.", time: "5m ago", icon: "⚖️", color: "#468BE6" }
  ],
  Portugal: [
    { name: "Portugal WC 2026 winner?", description: "Ronaldo's last dance bets.", time: "1m ago", icon: "🇵🇹", color: "#468BE6" },
    { name: "Lisbon Tech Exit > $1B?", description: "Unicorn hunting season.", time: "12m ago", icon: "🚀", color: "#468BE6" },
    { name: "Renewable Energy > 90%?", description: "Green grid targets.", time: "1h ago", icon: "🌿", color: "#468BE6" }
  ],
  Iran: [
    { name: "Oil Export Ceiling 2026?", description: "Global supply impact.", time: "8m ago", icon: "🛢️", color: "#468BE6" },
    { name: "Tehran Stock Index > 2M?", description: "Local currency hedge.", time: "4m ago", icon: "💹", color: "#468BE6" },
    { name: "Persian Gulf Trade Pack?", description: "New regional alliance.", time: "30m ago", icon: "🤝", color: "#468BE6" }
  ],
  Ukraine: [
    { name: "Reconstruction Fund Goal?", description: "EU-led recovery plan.", time: "3m ago", icon: "🏗️", color: "#468BE6" },
    { name: "Agriculture Export Record?", description: "Grain corridor stability.", time: "15m ago", icon: "🌾", color: "#468BE6" },
    { name: "IT Sector Growth > 20%?", description: "Digital resilience.", time: "2h ago", icon: "💻", color: "#468BE6" }
  ],
  Australia: [
    { name: "ASX 200 All-Time High?", description: "Mining sector rally.", time: "6m ago", icon: "🇦🇺", color: "#468BE6" },
    { name: "Great Barrier Reef Health?", description: "Restoration success.", time: "11m ago", icon: "🪸", color: "#468BE6" },
    { name: "Australia-UK Trade Deal?", description: "New export quotas.", time: "45m ago", icon: "🚢", color: "#468BE6" }
  ],
  Greenland: [
    { name: "New Nuuk Airport Open?", description: "Tourism expansion.", time: "20m ago", icon: "✈️", color: "#468BE6" },
    { name: "Ice Shelf Stability 2026?", description: "Arctic research data.", time: "1h ago", icon: "❄️", color: "#468BE6" },
    { name: "Mineral Export License?", description: "Northern mining rights.", time: "2h ago", icon: "⛏️", color: "#468BE6" }
  ]
};

const LOCATIONS = [
  { id: "US", lat: 37.0902, lon: -95.7129, name: "United States" },
  { id: "Portugal", lat: 39.3999, lon: -8.2245, name: "Portugal" },
  { id: "Iran", lat: 32.4279, lon: 53.6880, name: "Iran" },
  { id: "Ukraine", lat: 48.3794, lon: 31.1656, name: "Ukraine" },
  { id: "Australia", lat: -25.2744, lon: 133.7751, name: "Australia" },
  { id: "Greenland", lat: 71.7069, lon: -42.6043, name: "Greenland" }
];

const Notification = ({ name, description, icon, color, time }: any) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre text-black">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal text-black/60 capitalize">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export default function Home() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const tuftsBlue: [number, number, number] = [70 / 255, 139 / 255, 230 / 255];

  const handlePhiChange = React.useCallback((phi: number) => {
    const currentLon = ((-phi * 180 / Math.PI) % 360 + 540) % 360 - 180;

    const active = LOCATIONS.find(loc => {
      const diff = Math.abs(loc.lon - currentLon);
      return diff < 15 || diff > 345;
    });

    if (active) {
      setActiveId(prev => prev !== active.id ? active.id : prev);
    } else {
      setActiveId(prev => prev !== null ? null : prev);
    }
  }, []);

  const globeConfig = useMemo(() => ({
    width: 1600,
    height: 1600,
    onRender: () => { },
    devicePixelRatio: 2,
    phi: 0,
    theta: 0.3,
    dark: 0,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [1, 1, 1] as [number, number, number],
    markerColor: tuftsBlue,
    glowColor: [1, 1, 1] as [number, number, number],
    markers: LOCATIONS.map(loc => ({ location: [loc.lat, loc.lon] as [number, number], size: 0.1 })),
  }), [tuftsBlue]);

  const currentMarkets = useMemo(() => {
    if (!activeId) return [];
    return MARKETS[activeId as keyof typeof MARKETS] || [];
  }, [activeId]);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      {/* Centered Globe Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[800px] flex items-center justify-center relative translate-y-[100px]">
          <Globe
            onPhiChange={handlePhiChange}
            config={globeConfig}
          />

          {/* Location Label - Appears right above globe when focused */}
          <div className={cn(
            "absolute -top-10 left-1/2 -translate-x-1/2 transition-all duration-500",
            activeId ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <span className="px-4 py-2 bg-black text-white rounded-full font-bold text-sm tracking-widest uppercase">
              {activeId ? LOCATIONS.find(l => l.id === activeId)?.name : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Top Banner / Notifications */}
      <div className="absolute top-0 inset-x-0 h-1/2 pointer-events-none flex flex-col items-center pt-20">
        <div className={cn(
          "transition-all duration-700 flex flex-col items-center",
          activeId ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
        )}>
          <div className="w-[450px] min-h-[400px]">
            <AnimatedList delay={1500}>
              {currentMarkets.map((market, idx) => (
                <Notification key={`${activeId}-${idx}`} {...market} />
              ))}
            </AnimatedList>
          </div>

          {/* Black vertical line linking list to globe */}
          <div className={cn(
            "w-px bg-black transition-all duration-1000 origin-top",
            activeId ? "h-[200px] scale-y-100" : "h-0 scale-y-0"
          )}></div>
        </div>
      </div>

      {/* Bottom Launch Button - Always visible but subtle */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <button className="px-10 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-neutral-800 transition-all shadow-2xl">
          Enter six-seven
        </button>
      </div>
    </div>
  );
}
