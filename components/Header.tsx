'use client';

import { WalletConnect } from "./WalletConnect";
import { VaultControls } from "./VaultControls";
import Link from "next/link";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-black dark:text-white">
                            Six Seven
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <VaultControls />
                    <WalletConnect />
                </div>
            </div>
        </header>
    );
}
