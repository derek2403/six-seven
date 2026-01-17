"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { COMBINED_CHART_DATA } from "@/lib/mock/combined-markets";

// CustomDot: key prop is removed to avoid React special prop access error
const CustomDot = (props: any) => {
    const { cx, cy, index, lastIndex, color } = props;
    if (index === lastIndex) {
        return (
            <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />
        );
    }
    return null;
};

export function MarketCombinedChart() {
    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={COMBINED_CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        minTickGap={40}
                        tickFormatter={(val) => val.split(' ')[0] + ' ' + val.split(' ')[1]}
                    />
                    <YAxis
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        tickFormatter={(val) => `${val}%`}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                    />
                    <Line
                        type="monotone"
                        dataKey="value1"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={(props) => {
                            const { key, ...rest } = props;
                            return <CustomDot key={key} {...rest} color="#60a5fa" lastIndex={COMBINED_CHART_DATA.length - 1} />;
                        }}
                        activeDot={{ r: 4, fill: "#60a5fa" }}
                        isAnimationActive={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="value2"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={(props) => {
                            const { key, ...rest } = props;
                            return <CustomDot key={key} {...rest} color="#2563eb" lastIndex={COMBINED_CHART_DATA.length - 1} />;
                        }}
                        activeDot={{ r: 4, fill: "#2563eb" }}
                        isAnimationActive={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="value3"
                        stroke="#facc15"
                        strokeWidth={2}
                        dot={(props) => {
                            const { key, ...rest } = props;
                            return <CustomDot key={key} {...rest} color="#facc15" lastIndex={COMBINED_CHART_DATA.length - 1} />;
                        }}
                        activeDot={{ r: 4, fill: "#facc15" }}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
