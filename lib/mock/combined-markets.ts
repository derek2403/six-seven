export type CombinedMarketItem = {
    id: string;
    title: string;
    avatar: string;
    livePrice?: number;
    targetPrice?: number;
    priceChange24h?: number;
};

export type CombinedChartPoint = {
    date: string;
    value1: number; // Blue / Bitcoin
    value2: number; // Dark Blue / Ethereum
    value3: number; // Yellow / Solana
};

export type LegendItem = {
    label: string;
    value: string;
    color: string;
};

export type MarketCategoryData = {
    title: string;
    avatar: string;
    markets: CombinedMarketItem[];
    chartData: CombinedChartPoint[];
    legendItems: LegendItem[];
};

// --- DATA GENERATION HELPERS ---

const generatePoints = (
    endValues: [number, number, number],
    volatility: number = 2
): CombinedChartPoint[] => {
    const points: CombinedChartPoint[] = [];
    const endDate = new Date("2028-01-18T00:00:00");
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 6);

    let v1 = 40;
    let v2 = 20;
    let v3 = 25;

    const daysCount = 180;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i <= daysCount; i++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(startDate.getDate() + i);
        const times = ["7:00 am", "7:00 pm"];

        for (const time of times) {
            // Random walk
            v1 += (Math.random() - 0.5) * volatility;
            v2 += (Math.random() - 0.5) * volatility;
            v3 += (Math.random() - 0.5) * volatility;

            // Clamp mid-stream
            v1 = Math.max(5, Math.min(95, v1));
            v2 = Math.max(5, Math.min(95, v2));
            v3 = Math.max(5, Math.min(95, v3));

            // Force converge to end values at the last point
            if (i === daysCount && time === "7:00 pm") {
                v1 = endValues[0];
                v2 = endValues[1];
                v3 = endValues[2];
            }

            const month = months[currentDate.getMonth()];
            const day = currentDate.getDate();
            const year = currentDate.getFullYear();

            points.push({
                date: `${month} ${day}, ${year} ${time}`,
                value1: Number(v1.toFixed(1)),
                value2: Number(v2.toFixed(1)),
                value3: Number(v3.toFixed(1)),
            });
        }
    }
    return points;
};

// --- IRAN DATA ---

const IRAN_MARKETS: CombinedMarketItem[] = [
    { id: "m1", title: "Khamenei out as Supreme Leader of Iran by January 31?", avatar: "/leader.png" },
    { id: "m2", title: "US strikes Iran by January 31?", avatar: "/us-iran.png" },
    { id: "m3", title: "Isreal next strikes Iran by January 31?", avatar: "/isreal-iran.png" },
];

const IRAN_LEGEND: LegendItem[] = [
    { label: "Khamenei out as Supreme Leader of Iran by January 31?", value: "77%", color: "#60a5fa" },
    { label: "US strikes Iran by January 31?", value: "2.3%", color: "#2563eb" },
    { label: "Isreal next strikes Iran by January 31?", value: "1.7%", color: "#facc15" },
];

// --- CRYPTO DATA ---

const CRYPTO_MARKETS: CombinedMarketItem[] = [
    { id: "m1", title: "Bitcoin > $96k in 15 minutes?", avatar: "https://cryptologos.cc/logos/bitcoin-btc-logo.png", targetPrice: 96000 },
    { id: "m2", title: "Ethereum > $3.4k in 15 minutes?", avatar: "https://cryptologos.cc/logos/ethereum-eth-logo.png", targetPrice: 3400 },
    { id: "m3", title: "Sui > $1.9 in 15 minutes?", avatar: "https://cryptologos.cc/logos/sui-sui-logo.png", targetPrice: 1.9 },
];

const CRYPTO_LEGEND: LegendItem[] = [
    { label: "Bitcoin > $96k in 15 minutes?", value: "65%", color: "#60a5fa" },
    { label: "Ethereum > $3.4k in 15 minutes?", value: "42%", color: "#2563eb" },
    { label: "Sui > $1.9 in 15 minutes?", value: "88%", color: "#facc15" },
];

// --- EXPORTED DICTIONARY ---

export const MARKET_DATA: Record<string, MarketCategoryData> = {
    iran: {
        title: "Iran War",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcHjuJwQinnq7yrEdYTZNb6xYpuKE2zdRCXg&s",
        markets: IRAN_MARKETS,
        legendItems: IRAN_LEGEND,
        chartData: generatePoints([77, 2.3, 1.7]),
    },
    crypto: {
        title: "Crypto Bull Run",
        avatar: "/crypto_all.png",
        markets: CRYPTO_MARKETS,
        legendItems: CRYPTO_LEGEND,
        chartData: generatePoints([65, 42, 88], 3), // Higher volatility for crypto
    }
};

// Default fallback (Iran) for initial loads or unknown slugs if needed
export const DEFAULT_MARKET_DATA = {
    title: "Iran War",
    avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcHjuJwQinnq7yrEdYTZNb6xYpuKE2zdRCXg&s",
    markets: IRAN_MARKETS,
    legendItems: IRAN_LEGEND,
    chartData: generatePoints([77, 2.3, 1.7]),
};

// Backward compatibility for components not yet refactored (e.g. CombinedMarketLayout)
export const COMBINED_MARKETS = IRAN_MARKETS;
export const LEGEND_ITEMS = IRAN_LEGEND;
export const COMBINED_CHART_DATA = DEFAULT_MARKET_DATA.chartData;
