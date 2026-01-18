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
        avatar: "/leader.png",
    },
    {
        id: "m2",
        title: "US strikes Iran by January 31?",
        avatar: "/us-iran.png",
    },
    {
        id: "m3",
        title: "Isreal next strikes Iran by January 31?",
        avatar: "/isreal-iran.png",
    },
];

export const LEGEND_ITEMS = [
    { label: "Khamenei out as Supreme Leader of Iran by January 31?", value: "77%", color: "#60a5fa" }, // Light Blue
    { label: "US strikes Iran by January 31?", value: "2.3%", color: "#2563eb" },          // Dark Blue
    { label: "Isreal next strikes Iran by January 31?", value: "1.7%", color: "#facc15" },          // Yellow
];

// Generate complex mock data for the 3 lines with fluctuations over 6 months
const generatePoints = () => {
    const points: CombinedChartPoint[] = [];
    const endDate = new Date("2028-01-18T00:00:00");
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 6);

    // Base values and trajectories
    let v1 = 40;
    let v2 = 20;
    let v3 = 25;

    // Generate two points per day for 6 months (7:00 am and 7:00 pm)
    const daysCount = 180;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i <= daysCount; i++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(startDate.getDate() + i);

        // Add 7:00 am and 7:00 pm for each day
        const times = ["7:00 am", "7:00 pm"];

        for (const time of times) {
            // Add some noise and semi-random walk
            v1 += (Math.random() - 0.48) * 3;
            v2 += (Math.random() - 0.52) * 2;
            v3 += (Math.random() - 0.52) * 2;

            // Bounds
            v1 = Math.max(10, Math.min(95, v1));
            v2 = Math.max(1, Math.min(50, v2));
            v3 = Math.max(1, Math.min(50, v3));

            // Format date string for Tooltip: "Nov 1, 2025 7:00 am"
            const day = currentDate.getDate();
            const month = months[currentDate.getMonth()];
            const year = currentDate.getFullYear();

            // Final points adjustment for specific targets
            if (i === daysCount && time === "7:00 pm") {
                v1 = 77;
                v2 = 2.3;
                v3 = 1.7;
            }

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

export const COMBINED_CHART_DATA: CombinedChartPoint[] = generatePoints();
