"use client";

import React, { ReactElement, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AnimatedListProps {
    className?: string;
    children: React.ReactNode;
    delay?: number;
    stopAtEnd?: boolean;
    onComplete?: () => void;
}

export const AnimatedList = React.memo(
    ({ className, children, delay = 1000, stopAtEnd = false, onComplete }: AnimatedListProps) => {
        const [index, setIndex] = useState(0);
        const childrenArray = React.Children.toArray(children);
        const prevChildrenLengthRef = useRef(childrenArray.length);
        const hasCompletedRef = useRef(false);

        // Reset index when children change (e.g., new country hovered)
        useEffect(() => {
            if (prevChildrenLengthRef.current !== childrenArray.length) {
                setIndex(0);
                hasCompletedRef.current = false;
                prevChildrenLengthRef.current = childrenArray.length;
            }
        }, [childrenArray.length]);

        useEffect(() => {
            // If stopAtEnd is true and we've shown all items, don't continue
            if (stopAtEnd && index >= childrenArray.length - 1) {
                if (!hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    onComplete?.();
                }
                return;
            }

            const interval = setInterval(() => {
                setIndex((prevIndex) => {
                    if (stopAtEnd && prevIndex >= childrenArray.length - 1) {
                        return prevIndex; // Stay at last index
                    }
                    return (prevIndex + 1) % childrenArray.length;
                });
            }, delay);

            return () => clearInterval(interval);
        }, [childrenArray.length, delay, index, stopAtEnd, onComplete]);

        const itemsToShow = useMemo(
            () => childrenArray.slice(0, index + 1).reverse(),
            [index, childrenArray]
        );

        return (
            <div className={`flex flex-col items-center gap-4 ${className}`}>
                <AnimatePresence>
                    {itemsToShow.map((item) => (
                        <AnimatedListItem key={(item as ReactElement).key}>
                            {item}
                        </AnimatedListItem>
                    ))}
                </AnimatePresence>
            </div>
        );
    }
);

AnimatedList.displayName = "AnimatedList";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
    const animations = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, originY: 0 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: "spring", stiffness: 350, damping: 40 },
    };

    return (
        <motion.div {...animations} className="mx-auto w-full">
            {children}
        </motion.div>
    );
}
