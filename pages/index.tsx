import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletConnect } from "../components/WalletConnect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import RotatingEarth from "../components/RotatingEarth";
import WireframeCard from "../components/WireframeCard";
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
      className={`${geistSans.className} ${geistMono.className} min-h-screen bg-zinc-50 font-sans dark:bg-black`}
    >
      <WalletConnect />

      <main className="flex min-h-screen w-full flex-col items-center pt-32 px-4 sm:px-16 bg-white dark:bg-black overflow-hidden">
        <div className="w-full flex justify-center items-center h-[600px] fixed top-32 left-0 right-0 pointer-events-none px-10">
          <motion.div style={{ x }} className="pointer-events-auto z-10">
            <RotatingEarth />
          </motion.div>

          {/* Wireframe Card */}
          <motion.div
            style={{ opacity: cardOpacity, y: cardY }}
            className="absolute right-[10%] xl:right-[20%] pointer-events-auto z-20"
          >
            <WireframeCard />
          </motion.div>
        </div>

        {/* Scroll spacer */}
        <div className="h-[200vh] w-full"></div>
      </main>
    </div>
  );
}
