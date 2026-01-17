import { useState, useEffect } from 'react';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const REFRESH_INTERVAL_MS = 1000; // 5 seconds - fetching from local cache is cheap

export default function NoodlesTestPage() {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Mapping from coin address patterns to display names
    const COIN_NAMES: Record<string, string> = {
        '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI': 'SUI',
        '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN': 'WETH',
        '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN': 'SOL',
        '0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC': 'WBTC',
    };

    // Default: all 4 coins (SUI, WETH, SOL, WBTC)
    const DEFAULT_COINS = [
        '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
        '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
        '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
        '0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC',
    ];

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        // Don't clear response on refresh - keep showing old data while loading

        try {
            // Call our own API route with all default coins
            const res = await fetch(`/api/integrations/noodles?coins=${encodeURIComponent(DEFAULT_COINS.join(','))}`);
            const newData = await res.json();

            if (!res.ok) {
                throw new Error(newData.error || 'Failed to fetch data');
            }

            setResponse((prev: any) => {
                // If no previous data, just use new data
                if (!prev || !prev.data) return newData;

                // Merge new data into old data to preserve fields that might be missing in partial updates
                const mergedList = [...prev.data];

                if (newData.data && Array.isArray(newData.data)) {
                    newData.data.forEach((newCoinItem: any) => {
                        const index = mergedList.findIndex((item: any) => item.coin === newCoinItem.coin);

                        if (index !== -1) {
                            // Merge: New properties overwrite old ones, but missing properties in 'new' are kept from 'old'
                            // This works because the API seems to omit keys rather than sending nulls for partial updates
                            mergedList[index] = { ...mergedList[index], ...newCoinItem };
                        } else {
                            // New coin we haven't seen before
                            mergedList.push(newCoinItem);
                        }
                    });
                }

                return {
                    ...newData,
                    data: mergedList
                };
            });

            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [secondsRemaining, setSecondsRemaining] = useState(REFRESH_INTERVAL_MS / 1000);

    // Auto-refresh and timer countdown
    useEffect(() => {
        // Fetch immediately on mount
        fetchData();

        const timer = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    fetchData();
                    return REFRESH_INTERVAL_MS / 1000;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans`}>
            <main className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        Noodles.fi Integration Test
                    </h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Test the server-side WebSocket stream by fetching real-time coin updates via our API route.
                    </p>
                </header>

                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {Object.values(COIN_NAMES).map((name) => (
                                    <span key={name} className="px-3 py-1.5 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg">
                                        {name}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                                {loading && (
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        Updating...
                                    </span>
                                )}
                                {lastUpdated && !loading && (
                                    <span>
                                        Updated: {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Live Indicator */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${loading ? 'duration-500' : 'duration-1000'}`}></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </div>
                            <span>Auto-refreshing every 1 second</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {response && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Response Payload</h2>
                            <div className="relative">
                                <pre className="overflow-x-auto p-4 rounded-lg bg-zinc-900 text-zinc-50 text-xs font-mono border border-zinc-800">
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </div>

                            {response.data && response.data.length > 0 && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {response.data.map((item: any, idx: number) => {
                                        // Use COIN_NAMES mapping, fallback to extracting from identifier
                                        const symbol = COIN_NAMES[item.coin] || item.coin?.split('::').pop() || 'Unknown';
                                        return (
                                            <div key={idx} className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{symbol}</span>
                                                    {item.rank && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                            Rank #{item.rank}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-500">Price:</span>
                                                        <span className="font-mono font-medium">${item.price?.toFixed(4) || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-500">24h Change:</span>
                                                        <span className={`font-mono font-medium ${(item.price_change_24h || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {item.price_change_24h}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-500">Volume (24h):</span>
                                                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                                                            ${item.volume_24h?.toLocaleString() || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
