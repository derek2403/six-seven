"use client";

import React from "react";
import LaserHero from "@/components/landing/LaserHero";
import GlobeSection from "@/components/landing/GlobeSection";
import FlowingMenuSection from "@/components/landing/FlowingMenuSection";
import FeatureCardSection from "@/components/landing/FeatureCardSection";
import CardNav from "@/components/CardNav";

const NAV_ITEMS = [
  {
    label: "Markets",
    bgColor: "#0D0716",
    textColor: "#fff",
    links: [
      { label: "Crypto", ariaLabel: "Crypto Markets", href: "/crypto" },
      { label: "Politics", ariaLabel: "Politics Markets", href: "/data" }
    ]
  },
  {
    label: "Learn",
    bgColor: "#170D27",
    textColor: "#fff",
    links: [
      { label: "How It Works", ariaLabel: "How It Works" },
      { label: "Documentation", ariaLabel: "Documentation" }
    ]
  },
  {
    label: "Community",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [
      { label: "Discord", ariaLabel: "Join Discord" },
      { label: "Twitter", ariaLabel: "Twitter" },
      { label: "GitHub", ariaLabel: "GitHub" }
    ]
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden relative">
      {/* Navigation */}
      <CardNav
        logo="/logo.png"
        logoAlt="Phocast Logo"
        items={NAV_ITEMS}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
      />

      {/* Hero Section with Video */}
      <LaserHero />

      {/* Globe Section */}
      <GlobeSection />

      {/* Flowing Menu Section */}
      <FlowingMenuSection />

      {/* Feature Cards Section */}
      <FeatureCardSection />
    </div>
  );
}
