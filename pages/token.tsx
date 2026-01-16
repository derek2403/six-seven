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

export default function TokenPage() {
    return (
        <div
            className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black`}
        >
            <main className="flex w-full max-w-3xl flex-col items-center gap-8">
                <h1 className="text-3xl font-bold text-black dark:text-white">
                    Token Management
                </h1>

                <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <WalletConnect />
                </div>
            </main>
        </div>
    );
}
