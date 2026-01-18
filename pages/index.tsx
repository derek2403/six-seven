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
    { name: "Portugal WC 2028 winner?", description: "Ronaldo's last dance bets.", time: "1m ago", icon: "🇵🇹", color: "#468BE6" },
    { name: "Lisbon Tech Exit > $1B?", description: "Unicorn hunting season.", time: "12m ago", icon: "🚀", color: "#468BE6" },
    { name: "Renewable Energy > 90%?", description: "Green grid targets.", time: "1h ago", icon: "🌿", color: "#468BE6" }
  ],
  Iran: [
    { name: "Oil Export Ceiling 2028?", description: "Global supply impact.", time: "8m ago", icon: "🛢️", color: "#468BE6" },
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
    { name: "Ice Shelf Stability 2028?", description: "Arctic research data.", time: "1h ago", icon: "❄️", color: "#468BE6" },
    { name: "Mineral Export License?", description: "Northern mining rights.", time: "2h ago", icon: "⛏️", color: "#468BE6" }
  ]
};

import RotatingEarth from "../components/RotatingEarth";
import { AnimatedListDemo } from "../components/AnimatedListDemo";
import { motion, useScroll, useTransform } from "framer-motion";
// ... imports

export default function Home() {
  const { scrollY } = useScroll();
  const x = useTransform(scrollY, [0, 400], [0, -300]); // Reduced shift slightly to keep it visible
  const titleOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  // Card animations - appear after scroll > 300
  const cardOpacity = useTransform(scrollY, [300, 500], [0, 1]);
  const cardY = useTransform(scrollY, [300, 500], [100, 0]);

  return (
    <div
      className={`min-h-screen bg-zinc-50 font-sans dark:bg-black`}
    >

      <main className="flex min-h-screen w-full flex-col items-center pt-32 px-4 sm:px-16 bg-white dark:bg-black overflow-hidden">
        <div className="w-full flex justify-center items-center h-[600px] fixed top-32 left-0 right-0 pointer-events-none px-10">
          <motion.div style={{ x }} className="pointer-events-auto z-10">
            <RotatingEarth />
          </motion.div>

          {/* Animated List Card */}
          <motion.div
            style={{ opacity: cardOpacity, y: cardY }}
            className="absolute right-[5%] xl:right-[15%] pointer-events-auto z-20"
          >
            <AnimatedListDemo className="w-full max-w-[400px] shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800" />
          </motion.div>
        </div>

        {/* Scroll spacer */}
        <div className="h-[200vh] w-full"></div>
      </main>
    </div>
  );
}
