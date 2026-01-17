export type ChartPoint = {
    date: string;
    value: number;
};

export function getMockMarketData(slug: string) {
    // Generate points to match the screenshot curve
    // Jan 7-9: ~10% noisy
    // Jan 10-12: ~20% noisy
    // Jan 13-14: ~25% noisy
    // Jan 15: Drop to 15%
    // Jan 16: Drop to 7%
    const chartData: ChartPoint[] = [
        { date: "Jan 7 00:00", value: 8 },
        { date: "Jan 7 06:00", value: 12 },
        { date: "Jan 7 12:00", value: 9 },
        { date: "Jan 7 18:00", value: 11 },
        { date: "Jan 8 00:00", value: 10 },
        { date: "Jan 8 12:00", value: 7 },
        { date: "Jan 9 00:00", value: 9 },
        { date: "Jan 9 12:00", value: 13 },
        { date: "Jan 10 00:00", value: 18 },
        { date: "Jan 10 12:00", value: 22 },
        { date: "Jan 11 00:00", value: 19 },
        { date: "Jan 11 12:00", value: 21 },
        { date: "Jan 12 00:00", value: 24 },
        { date: "Jan 12 12:00", value: 20 },
        { date: "Jan 13 00:00", value: 18 },
        { date: "Jan 13 12:00", value: 19 },
        { date: "Jan 14 00:00", value: 23 },
        { date: "Jan 14 06:00", value: 25 },
        { date: "Jan 14 12:00", value: 21 },
        { date: "Jan 15 00:00", value: 14 },
        { date: "Jan 15 12:00", value: 10 },
        { date: "Jan 16 00:00", value: 8 },
        { date: "Jan 16 12:00", value: 7 },
    ];

    return {
        slug,
        title: "Khamenei out as Supreme Leader of Iran by January 31?",
        avatarSrc: "/iran-flag.png",
        currentValue: 7,
        change24h: -2,
        volume: "$33,277,441",
        endDate: "Jan 31, 2026",
        chartData,
        defaultSelected: "jan-31",
        pills: [
            {
                kind: "dropdown" as const,
                label: "Past",
                value: "past",
                items: [
                    { label: "Past 24h" },
                    { label: "Past week" },
                    { label: "Past month" },
                ],
            },
            { kind: "toggle" as const, label: "Jan 31", value: "jan-31" },
            { kind: "toggle" as const, label: "Feb 28", value: "feb-28" },
            { kind: "toggle" as const, label: "Mar 31", value: "mar-31" },
            { kind: "toggle" as const, label: "Jun 30", value: "jun-30" },
            {
                kind: "dropdown" as const,
                label: "More",
                value: "more",
                items: [
                    { label: "Jul 31" },
                    { label: "Aug 31" },
                    { label: "Dec 31" },
                ],
            },
        ],
    };
}
