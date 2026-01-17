export type CombinedMarketItem = {
    id: string;
    title: string;
    avatar: string;
};

export type CombinedChartPoint = {
    date: string;
    value1: number; // Light Blue
    value2: number; // Dark Blue
    value3: number; // Yellow
};

export const COMBINED_MARKETS: CombinedMarketItem[] = [
    {
        id: "m1",
        title: "Khamenei out as Supreme Leader of Iran by January 31?",
        avatar: "/leader.png?v=2",
    },
    {
        id: "m2",
        title: "US strikes Iran by January 31?",
        avatar: "/us-iran.png?v=2",
    },
    {
        id: "m3",
        title: "Isreal next strikes Iran by January 31?",
        avatar: "/isreal-iran.png?v=2",
    },
];

export const LEGEND_ITEMS = [
    { label: "Khamenei out as Supreme Leader of Iran by January 31?", value: "77%", color: "#60a5fa" }, // Light Blue
    { label: "US strikes Iran by January 31?", value: "2.3%", color: "#2563eb" },          // Dark Blue
    { label: "Isreal next strikes Iran by January 31?", value: "1.7%", color: "#facc15" },          // Yellow
];

// Generate mock data for the 3 lines
export const COMBINED_CHART_DATA: CombinedChartPoint[] = [
    { date: "Jan 14", value1: 50, value2: 25, value3: 30 },
    { date: "Jan 14 06:00", value1: 60, value2: 5, value3: 6 },
    { date: "Jan 14 12:00", value1: 55, value2: 3, value3: 4 },
    { date: "Jan 15 00:00", value1: 65, value2: 4, value3: 3 },
    { date: "Jan 15 12:00", value1: 30, value2: 2, value3: 2 },
    { date: "Jan 16 00:00", value1: 55, value2: 3, value3: 2 },
    { date: "Jan 16 12:00", value1: 68, value2: 2, value3: 2 },
    { date: "Jan 17 00:00", value1: 72, value2: 2, value3: 1 },
    { date: "Jan 17 12:00", value1: 75, value2: 2, value3: 1 },
    { date: "Jan 18 00:00", value1: 77, value2: 2.3, value3: 1.7 },
];
