"use client"

import { cn } from "../lib/utils";
import { AnimatedList } from "./AnimatedList";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Item {
    name: string;
    description: string;
    icon?: string;
    color?: string;
    time?: string;
    value?: string;
    code?: string;
}

const Notification = ({ name, description, icon, color, time }: Item) => {
    return (
        <figure
            className={cn(
                "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
                "transition-all duration-200 ease-in-out hover:scale-[103%]",
                "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
                "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
            )}
        >
            <div className="flex flex-row items-center gap-3">
                <div
                    className="flex size-10 items-center justify-center rounded-2xl flex-shrink-0"
                    style={{ backgroundColor: color }}
                >
                    <span className="text-lg">{icon}</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
                        <span className="text-sm sm:text-lg text-black dark:text-white">{name}</span>
                        <span className="mx-1">·</span>
                        <span className="text-xs text-gray-500">{time}</span>
                    </figcaption>
                    <p className="text-sm font-normal text-gray-500 dark:text-white/60">
                        {description}
                    </p>
                </div>
            </div>
        </figure>
    )
}

// Lock icon component - outline style
const LockIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="16" height="12" rx="2" fill="none" stroke="#1A5799" strokeWidth="1.5" />
        <path d="M8 10V6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V10" stroke="#1A5799" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="15" r="1.5" fill="#1A5799" />
        <path d="M12 16.5V18" stroke="#1A5799" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Arrow path: down from bottom-center of box, curve left, then back down
const ArrowWithDot = ({ isActive, startDot }: { isActive: boolean; startDot: boolean }) => {
    // Path: starts at center of box (x=210), goes down from y=-10 to connect to container, curves left, then straight down
    const arrowPath = "M210 -10 L210 80 Q210 120 160 120 L-100 120 Q-150 120 -150 170 L-150 580";
    const dotPath = "M210 -10 L210 80 Q210 120 160 120 L-100 120 Q-150 120 -150 170 L-150 600";

    return (
        <div className="relative w-[420px] h-[600px]" style={{ marginTop: '-10px' }}>
            {/* Hero Text - Built Entirely on SUI (single line, centered on horizontal arrow) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute left-[-400px] bottom-[250px] whitespace-nowrap"
                style={{ transform: "translateX(-50%)" }}
            >
                <div className="leading-none">
                    {/* Line 1 */}
                    <div className="text-4xl font-bold text-black leading-tight">
                        Built Entirely on
                    </div>

                    {/* Line 2 (bigger) */}
                    <div className="mt-3 flex items-center gap-4">
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR12mA3zSzz_9SWnLm4B_0OocWAQhpAnaAzYA&s"
                            alt="SUI"
                            className="h-20 w-20 object-contain"
                        />
                        <span className="text-[#468BE6] font-extrabold text-7xl tracking-tight">
                            SUI
                        </span>
                    </div>
                </div>
            </motion.div>


            <svg width="500" height="600" viewBox="-200 0 500 600" fill="none" className="overflow-visible">
                {/* Arrow path - same color as container (#93BFEF) */}
                <motion.path
                    d={arrowPath}
                    stroke="#93BFEF"
                    strokeWidth="2.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={isActive ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                {/* Arrow head */}
                <motion.path
                    d="M-160 570 L-150 590 L-140 570"
                    stroke="#93BFEF"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 1.3, duration: 0.3 }}
                />
                {/* Moving dot */}
                {startDot && (
                    <motion.circle
                        r="6"
                        fill="#93BFEF"
                        initial={{ offsetDistance: "0%" }}
                        animate={{ offsetDistance: "100%" }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{
                            offsetPath: `path('${dotPath}')`,
                        }}
                    />
                )}
            </svg>
        </div>
    );
};

export function AnimatedListDemo({
    className,
    items = [],
    title = "Live Data Feed",
    flag = "🌐",
    stopAtEnd = false,
    onComplete
}: {
    className?: string;
    items?: Item[];
    title?: string;
    flag?: string;
    stopAtEnd?: boolean;
    onComplete?: () => void;
}) {
    const [animationPhase, setAnimationPhase] = useState<'loading' | 'traced' | 'locked' | 'arrow' | 'dot'>('loading');

    const handleComplete = () => {
        // Phase 1: Start trace animation
        setTimeout(() => {
            setAnimationPhase('traced');
        }, 300);

        // Phase 2: Fill blue and show lock
        setTimeout(() => {
            setAnimationPhase('locked');
        }, 2000);

        // Phase 3: Start arrow drawing
        setTimeout(() => {
            setAnimationPhase('arrow');
        }, 3000);

        // Phase 4: Start the dot moving
        setTimeout(() => {
            setAnimationPhase('dot');
        }, 4700);

        onComplete?.();
    };

    // Reset when items change
    useEffect(() => {
        setAnimationPhase('loading');
    }, [items]);

    const showTrace = animationPhase === 'traced';
    const showLock = animationPhase === 'locked' || animationPhase === 'arrow' || animationPhase === 'dot';
    const showArrow = animationPhase === 'arrow' || animationPhase === 'dot';
    const startDot = animationPhase === 'dot';

    return (
        <div className="flex flex-col items-center">
            {/* Main container - fixed size */}
            <div
                className={cn(
                    "relative flex h-[400px] w-[420px] flex-col overflow-hidden p-4 rounded-3xl",
                    className
                )}
                style={{
                    backgroundColor: showLock ? "#93BFEF" : "rgba(255,255,255,0.8)"
                }}
            >
                {/* Trace outline animation */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{ borderRadius: '1.5rem' }}
                >
                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="24"
                        ry="24"
                        fill="none"
                        stroke="#468BE6"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={showTrace ? { pathLength: 1, opacity: 1 } : showLock ? { pathLength: 1, opacity: 0 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </svg>

                {/* Lock icon overlay */}
                <AnimatePresence>
                    {showLock && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        >
                            <LockIcon />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Events content - hidden when locked */}
                <motion.div
                    animate={{ opacity: showLock ? 0 : 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-4"
                >
                    <AnimatedList stopAtEnd={stopAtEnd} onComplete={handleComplete}>
                        {items.map((item, idx) => (
                            <Notification {...item} key={idx} />
                        ))}
                    </AnimatedList>
                </motion.div>

                {!showLock && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-black"></div>
                )}
            </div>

            {/* Arrow: goes down from center-bottom, curves left to middle of page, then down */}
            {showArrow && <ArrowWithDot isActive={showArrow} startDot={startDot} />}
        </div>
    )
}
