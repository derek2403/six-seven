"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeatureCard {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    media: string;
    mediaType: "image" | "video";
    bgColor: string;
}

const FEATURE_CARDS: FeatureCard[] = [
    {
        id: 1,
        title: "Multi-Market",
        subtitle: "One Pool, Many Markets",
        description:
            "Trade familiar Yes/No markets with deeper liquidity. Express richer views through scenarios, partial bets, and exact outcomes — all powered by a single unified world table.",
        media: "/multi.png",
        mediaType: "image",
        bgColor: "#3B5BDB",
    },
    {
        id: 2,
        title: "Combined Liquidity",
        subtitle: "Unified Depth",
        description:
            "No more fragmented pools. One shared market-making engine supports all correlated questions, reducing spreads and enabling faster price discovery across related events.",
        media: "/liquidity.png",
        mediaType: "image",
        bgColor: "#5C7CFA",
    },
    {
        id: 3,
        title: "Nautilus",
        subtitle: "TEE-Shielded Privacy",
        description:
            "Bet privately using Sui's native TEE framework. Individual positions remain encrypted; only aggregated world probabilities are published. Insiders can trade without fear of exposure.",
        media: "/nautilus.mp4",
        mediaType: "video",
        bgColor: "#4263EB",
    },
];

export default function FeatureCardSection() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % FEATURE_CARDS.length);
    };

    const goToPrev = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + FEATURE_CARDS.length) % FEATURE_CARDS.length
        );
    };

    const currentCard = FEATURE_CARDS[currentIndex];

    return (
        <section className="relative w-full min-h-screen overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                    style={{ backgroundColor: currentCard.bgColor }}
                >
                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col lg:flex-row items-center justify-between px-8 lg:px-16 py-16">
                        {/* Left Side - Text Content */}
                        <div className="flex-1 max-w-xl lg:pr-12">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-white/80 text-sm font-medium tracking-wider uppercase">
                                    Phocast
                                </span>
                                <a
                                    href="#"
                                    className="text-white/80 text-sm font-medium hover:text-white transition-colors"
                                >
                                    Learn More
                                </a>
                            </div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl lg:text-6xl font-light text-white leading-tight mb-12"
                            >
                                {currentCard.title.split(" ").map((word, i) => (
                                    <React.Fragment key={i}>
                                        {word}
                                        {i < currentCard.title.split(" ").length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </motion.h2>

                            {/* Bottom Text */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-white/90 text-sm leading-relaxed max-w-md"
                            >
                                {currentCard.description}
                            </motion.p>
                        </div>

                        {/* Right Side - Media */}
                        <div className="flex-1 relative mt-12 lg:mt-0 flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="relative w-full max-w-lg"
                            >
                                {currentCard.mediaType === "video" ? (
                                    <video
                                        src={currentCard.media}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-auto rounded-2xl shadow-2xl"
                                    />
                                ) : (
                                    <img
                                        src={currentCard.media}
                                        alt={currentCard.title}
                                        className="w-full h-auto rounded-2xl shadow-2xl"
                                    />
                                )}

                                {/* Side Description */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="absolute -right-4 lg:right-0 top-1/2 -translate-y-1/2 translate-x-full hidden lg:block max-w-xs pl-8"
                                >
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        {currentCard.subtitle}
                                    </p>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Card Number */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-12 right-12 lg:right-24"
                    >
                        <span className="text-8xl lg:text-9xl font-bold text-white/20">
                            0{currentCard.id}
                        </span>
                    </motion.div>

                    {/* Navigation Arrows */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                        <button
                            onClick={goToPrev}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            aria-label="Previous card"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Dots Indicator */}
                        <div className="flex items-center gap-2">
                            {FEATURE_CARDS.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                            ? "bg-white w-6"
                                            : "bg-white/40 hover:bg-white/60"
                                        }`}
                                    aria-label={`Go to card ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={goToNext}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            aria-label="Next card"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    );
}
