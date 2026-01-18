"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { cn } from "@/lib/utils";
import FlowingMenu from "@/components/FlowingMenu";
import Link from "next/link";


const MARKETS = {
  US: [
    { name: "Fed rate cut in Feb?", description: "High conviction among analysts.", time: "2m ago", icon: "🇺🇸", color: "#468BE6" },
    { name: "S&P 500 above 6000?", description: "Market sentiment is bullish.", time: "10m ago", icon: "📈", color: "#468BE6" },
    { name: "US Tech Regulation Bill?", description: "Senate vote expected soon.", time: "5m ago", icon: "⚖️", color: "#468BE6" },
    { name: "Trump 2028 Candidacy?", description: "Political futures heating up.", time: "15m ago", icon: "🏛️", color: "#468BE6" }
  ],
  Portugal: [
    { name: "Portugal WC 2028 winner?", description: "Ronaldo's last dance bets.", time: "1m ago", icon: "🇵🇹", color: "#468BE6" },
    { name: "Lisbon Tech Exit > $1B?", description: "Unicorn hunting season.", time: "12m ago", icon: "🚀", color: "#468BE6" },
    { name: "Renewable Energy > 90%?", description: "Green grid targets.", time: "1h ago", icon: "🌿", color: "#468BE6" },
    { name: "Porto Housing Boom?", description: "Real estate market surge.", time: "2h ago", icon: "🏠", color: "#468BE6" }
  ],
  Iran: [
    { name: "Oil Export Ceiling 2028?", description: "Global supply impact.", time: "8m ago", icon: "🛢️", color: "#468BE6" },
    { name: "Tehran Stock Index > 2M?", description: "Local currency hedge.", time: "4m ago", icon: "💹", color: "#468BE6" },
    { name: "Persian Gulf Trade Pack?", description: "New regional alliance.", time: "30m ago", icon: "🤝", color: "#468BE6" },
    { name: "Sanctions Relief 2025?", description: "Diplomatic developments.", time: "1h ago", icon: "🕊️", color: "#468BE6" }
  ],
  Ukraine: [
    { name: "Reconstruction Fund Goal?", description: "EU-led recovery plan.", time: "3m ago", icon: "🏗️", color: "#468BE6" },
    { name: "Agriculture Export Record?", description: "Grain corridor stability.", time: "15m ago", icon: "🌾", color: "#468BE6" },
    { name: "IT Sector Growth > 20%?", description: "Digital resilience.", time: "2h ago", icon: "💻", color: "#468BE6" },
    { name: "Ceasefire by Summer?", description: "Peace talks progress.", time: "30m ago", icon: "🕊️", color: "#468BE6" }
  ],
  Australia: [
    { name: "ASX 200 All-Time High?", description: "Mining sector rally.", time: "6m ago", icon: "🇦🇺", color: "#468BE6" },
    { name: "Great Barrier Reef Health?", description: "Restoration success.", time: "11m ago", icon: "🪸", color: "#468BE6" },
    { name: "Australia-UK Trade Deal?", description: "New export quotas.", time: "45m ago", icon: "🚢", color: "#468BE6" },
    { name: "Lithium Export Boom?", description: "EV battery demand surge.", time: "1h ago", icon: "🔋", color: "#468BE6" }
  ],
  Greenland: [
    { name: "New Nuuk Airport Open?", description: "Tourism expansion.", time: "20m ago", icon: "✈️", color: "#468BE6" },
    { name: "Ice Shelf Stability 2026?", description: "Arctic research data.", time: "1h ago", icon: "❄️", color: "#468BE6" },
    { name: "Mineral Export License?", description: "Northern mining rights.", time: "2h ago", icon: "⛏️", color: "#468BE6" },
    { name: "Independence Vote 2030?", description: "Political self-determination.", time: "3h ago", icon: "🗳️", color: "#468BE6" }
  ],
  China: [
    { name: "GDP Growth > 5%?", description: "Stimulus package effect.", time: "5m ago", icon: "🐉", color: "#468BE6" },
    { name: "EV Export Record?", description: "Global market dominance.", time: "20m ago", icon: "🚗", color: "#468BE6" },
    { name: "Space Station Complete?", description: "New module launch.", time: "1h ago", icon: "🛰️", color: "#468BE6" },
    { name: "Yuan Internationalization?", description: "Currency adoption growth.", time: "2h ago", icon: "💴", color: "#468BE6" }
  ],
  Russia: [
    { name: "Tech Sovereignty 2025?", description: "Domestic chip production.", time: "10m ago", icon: "🐻", color: "#468BE6" },
    { name: "Arctic Trade Route?", description: "New shipping lanes.", time: "30m ago", icon: "🚢", color: "#468BE6" },
    { name: "Crypto Regulation Bill?", description: "Digital ruble launch.", time: "1h ago", icon: "🪙", color: "#468BE6" },
    { name: "Gas Pipeline Expansion?", description: "Energy infrastructure.", time: "2h ago", icon: "⛽", color: "#468BE6" }
  ],
  Kenya: [
    { name: "Konza Tech City Launch?", description: "Silicon Savannah progress.", time: "15m ago", icon: "🦁", color: "#468BE6" },
    { name: "Tourism Rebound 2025?", description: "Safari bookings surge.", time: "45m ago", icon: "🦓", color: "#468BE6" },
    { name: "Shilling Stability?", description: "Forex reserve targets.", time: "2h ago", icon: "💱", color: "#468BE6" },
    { name: "M-Pesa Global Expansion?", description: "Fintech dominance.", time: "3h ago", icon: "📱", color: "#468BE6" }
  ]
};

const GLOBE_MARKERS = [
  { lat: 37.0902, lng: -95.7129, label: "United States" },
  { lat: -25.2744, lng: 133.7751, label: "Australia" },
  { lat: 32.4279, lng: 53.6880, label: "Iran" },
  { lat: 35.8617, lng: 104.1954, label: "China" },
  { lat: 61.5240, lng: 105.3188, label: "Russia" },
  { lat: 39.3999, lng: -8.2245, label: "Portugal" },
  { lat: -1.2921, lng: 36.8219, label: "Kenya" },
];

const FLAGS: Record<string, string> = {
  "United States": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg",
  "Australia": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgkg6OTMEW34B1dJ-_9oGOxh7dkSGPZjFLmA&s",
  "Iran": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Flag_of_Iran.svg/1280px-Flag_of_Iran.svg.png",
  "China": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_People%27s_Republic_of_China.svg/1280px-Flag_of_the_People%27s_Republic_of_China.svg.png",
  "Russia": "https://cdn.britannica.com/42/3842-050-68EEE2C4/Flag-Russia.jpg",
  "Portugal": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Portugal.svg/960px-Flag_of_Portugal.svg.png",
  "Kenya": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR345PcOfn3gzfHd4EfQe3aYdg62CDfAR64OQ&s"
};

// ... (existing code)



const COUNTRY_CODES: Record<string, string> = {
  "United States": "US",
  "Australia": "AU",
  "Iran": "IR",
  "China": "CN",
  "Russia": "RU",
  "Portugal": "PT",
  "Kenya": "KE"
};

import RotatingEarth from "../components/RotatingEarth";
import { AnimatedListDemo, Item } from "../components/AnimatedListDemo";
import { motion, AnimatePresence } from "framer-motion";
// ... imports

export default function Home() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const handleMarkerHover = useCallback((marker: { label?: string } | null) => {
    // Only update if we are hovering a new valid marker.
    // We do NOT reset to null when hovering empty space (sticky behavior).
    if (marker?.label) {
      setHoveredCountry(marker.label);
    }
  }, []);

  const currentMarketItems: Item[] = useMemo(() => {
    if (!hoveredCountry) return [];
    // Map the country name to the key in MARKETS (e.g. "United States" -> "US")
    let key = hoveredCountry;
    if (hoveredCountry === "United States") key = "US";

    // @ts-ignore
    const market = MARKETS[key];
    if (!market) return [];

    // Map to AnimatedListDemo Item format
    return market.map((m: any) => ({
      name: m.name,
      description: m.description,
      value: m.time,
      code: "MKT_01",
      time: m.time,
      icon: m.icon,
      color: m.color
    }));
  }, [hoveredCountry]);

  return (
    <div className="min-h-screen bg-white font-sans dark:bg-white">
      {/* Hero Section - extra height to accommodate arrow and provide white space */}
      <section className="min-h-[120vh] w-full flex items-start justify-center pt-32 relative overflow-visible">
        {/* Logo at the top left */}
        <div className="absolute top-8 left-10 z-50">
          <Link href="/">
            <img
              src="/phocastlogo.png"
              alt="Phocast Logo"
              className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        {/* Start Button at the top right */}
        <div className="absolute top-8 right-10 z-50">
          <Link href="/data">
            <button className="px-8 py-3 bg-blue-900 text-white rounded-full font-semibold hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
              Start
            </button>
          </Link>
        </div>
        <div className="flex items-start justify-center gap-8 w-full max-w-7xl px-10">
          {/* Globe - static position, stays on this page */}
          <motion.div
            animate={{ x: hoveredCountry ? -100 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="flex-shrink-0"
          >
            <RotatingEarth
              markers={GLOBE_MARKERS}
              onMarkerHover={handleMarkerHover}
            />
          </motion.div>

          {/* Animated List Card */}
          <AnimatePresence>
            {hoveredCountry && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Header Section - Centered */}
                <div className="flex flex-col items-center w-[420px]">
                  <h2 className="text-4xl font-bold text-black leading-tight flex items-center justify-center gap-3">
                    <span className="text-[#468BE6]">{hoveredCountry}</span>
                    <img src={FLAGS[hoveredCountry]} alt={hoveredCountry} className="h-8 w-auto object-cover rounded-sm" />
                  </h2>
                </div>

                <AnimatedListDemo
                  className="w-[420px] bg-white/80 backdrop-blur-md"
                  items={currentMarketItems}
                  stopAtEnd={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Next Section - FlowingMenu */}
      <section className="h-screen w-full mt-65">
        <FlowingMenu
          items={[
            { link: '#', text: 'Multi-Dimensional Prediction Market', image: '/flowingmenu/Multi-Dimensional_Prediction_Market.png' },
            { link: '#', text: 'Unified Liquidity', image: '/flowingmenu/Unified_Liquidity.png' },
            { link: '#', text: 'World Table', image: '/flowingmenu/World_Table.png' },
            { link: '#', text: 'Marginals', image: '/flowingmenu/Marginals.png' },
            { link: '#', text: 'Slices', image: '/flowingmenu/Slice.png' },
            { link: '#', text: 'Corners', image: '/flowingmenu/Corners.png' },
            { link: '#', text: 'Coherent Pricing', image: '/flowingmenu/Coherent_Pricing.png' },
            { link: '#', text: 'LMSR', image: '/flowingmenu/LSMR.png' },
            { link: '#', text: 'Privacy', image: '/flowingmenu/Privacy.png' }
          ]}
        />
      </section>
    </div>
  );
}
