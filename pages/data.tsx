import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import politicsEvents from '../data/metadata/politics_events.json';
import sportsEvents from '../data/metadata/sports.json';
import { Header } from '../components/header';

// Helper to parse JSON strings that might be in the data
const safeParse = (str: string) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return [];
    }
};

const formatMoney = (amount: number) => {
    if (!amount) return '$0';
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}m`;
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
};

const FeaturedEventCard = ({ title, icon, items }: { title: string, icon: string, items: any[] }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <img
                        src={icon}
                        alt={title}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm"
                    />
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {title}
                    </h3>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-4">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://polymarket.com/static/error/image-error.png' }}
                            />
                            <span className="text-[15px] font-medium text-gray-700 leading-snug">
                                {item.title}
                            </span>
                        </div>
                        <div className="flex space-x-3 pl-14">
                            <button className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex justify-between items-center">
                                <span>Yes</span>
                                <span>0%</span>
                            </button>
                            <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex justify-between items-center">
                                <span>No</span>
                                <span>0%</span>
                            </button>
                            <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex justify-between items-center">
                                <span>Any</span>
                                <span>0%</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const politicsFeaturedData = [
    {
        title: "Iran War",
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Flag_of_Iran.svg/1200px-Flag_of_Iran.svg.png",
        items: [
            { title: "Khamenei out as Supreme Leader of Iran by January 31?", image: "/leader.png" },
            { title: "US strikes Iran by January 31?", image: "/us-iran.png" },
            { title: "Isreal next strikes Iran by January 31?", image: "/isreal-iran.png" }
        ]
    },
    {
        title: "Trump Presidency",
        icon: "/market/trump_portrait.png",
        items: [
            { title: "Will Trump end the Ukraine war in 90 days?", image: "/market/ukraine_war.png" },
            { title: "Will Trump impose 60% tariffs on China?", image: "/market/china_tariffs.png" },
            { title: "Will Trump deport 1M+ people in 2026?", image: "/market/deportation.png" }
        ]
    },
    {
        title: "US Elections 2026",
        icon: "/market/pre-winner.png",
        items: [
            { title: "Will Republicans keep the House in 2026?", image: "/market/house.png" },
            { title: "Will Democrats win the Senate in 2026?", image: "/market/senate.png" },
            { title: "Will JD Vance run for President in 2028?", image: "/market/vance.png" }
        ]
    }
];

const cryptoFeaturedData = [
    {
        title: "Crypto Majors (15m)",
        icon: "/market/eth_featured.png",
        items: [
            { title: "Will Bitcoin hit $150k by March 31?", image: "/market/btc.png" },
            { title: "Will Ethereum hit $5k by March 31?", image: "/market/eth_featured.png" },
            { title: "Will Solana hit $500 by March 31?", image: "/market/sol_featured.png" }
        ]
    },
    {
        title: "AI & Innovation",
        icon: "/market/sol_featured.png",
        items: [
            { title: "Will OpenAI release GPT-5 by June?", image: "/market/openai.png" },
            { title: "Will Tesla achieve Level 5 FSD in 2026?", image: "/market/tesla.png" },
            { title: "Will NVIDIA hit $5T market cap?", image: "/market/nvidia.png" }
        ]
    },
    {
        title: "Global Markets",
        icon: "/market/china_tariffs.png",
        items: [
            { title: "Will S&P 500 hit 7000 by year end?", image: "/market/sp500.png" },
            { title: "Will Gold hit $3500 by December?", image: "/market/gold.png" },
            { title: "Will Oil drop below $50 in 2026?", image: "/market/oil.png" }
        ]
    }
];

const EventCard = ({ event }: { event: any }) => {
    const marketsToDisplay = event.markets.slice(0, 3); // Limit to 3 for space

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between h-full group">
            <div>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                        <img
                            src={event.image || event.icon}
                            alt={event.title}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://polymarket.com/static/error/image-error.png' }}
                        />
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-3 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
                            {event.title}
                        </h3>
                    </div>
                    {/* Chance percentage - usually for the "Yes" outcome of the main market */}
                    {event.markets[0] && (
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-bold text-gray-900">
                                {Math.round(parseFloat(safeParse(event.markets[0].outcomePrices)[0] || '0') * 100)}%
                            </span>
                            <span className="text-xs text-gray-500">chance</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 mb-4">
                    {marketsToDisplay.map((market: any) => {
                        const outcomes = safeParse(market.outcomes);
                        const prices = safeParse(market.outcomePrices);

                        return (
                            <div key={market.id} className="flex items-center justify-between space-x-2">
                                {event.markets.length > 1 && (
                                    <span className="text-sm text-gray-700 font-medium truncate flex-1">
                                        {market.groupItemTitle || market.question}
                                    </span>
                                )}

                                <div className={`flex w-full ${outcomes.some((o: string) => o.length > 20) ? 'flex-col space-y-2' : 'space-x-1'}`}>
                                    {outcomes.map((outcome: string, idx: number) => {
                                        const price = prices && prices[idx] ? Math.round(parseFloat(prices[idx]) * 100) : 0;
                                        const isYesOrUpOrOver = outcome === 'Yes' || outcome === 'Up' || outcome === 'Over';
                                        const isNoOrDownOrUnder = outcome === 'No' || outcome === 'Down' || outcome === 'Under';

                                        let colorClass = "bg-gray-50 hover:bg-gray-100 text-gray-700";

                                        if (isYesOrUpOrOver) {
                                            colorClass = "bg-emerald-50 hover:bg-emerald-100 text-emerald-700";
                                        } else if (isNoOrDownOrUnder) {
                                            colorClass = "bg-red-50 hover:bg-red-100 text-red-700";
                                        } else if (outcomes.length === 2) {
                                            // Team colors for 2-outcome markets (excluding Yes/No/Over/Under)
                                            if (idx === 0) {
                                                colorClass = "bg-blue-50 hover:bg-blue-100 text-blue-700";
                                            } else {
                                                colorClass = "bg-amber-50 hover:bg-amber-100 text-amber-700";
                                            }
                                        }

                                        return (
                                            <button key={idx} className={`flex-1 ${colorClass} text-sm font-medium py-1.5 px-3 rounded transition-colors flex justify-between items-center w-full`}>
                                                <span className="truncate mr-1">{outcome}</span>
                                                <span>{price}%</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">
                <span className="font-medium text-gray-700">
                    {formatMoney(event.volume)} Vol.
                </span>
                <div className="flex space-x-2">
                    {/* Placeholder for icons like comments or favorites */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </div>
            </div>
        </div>
    );
};

export default function DataPage() {
    const [activeFilter, setActiveFilter] = useState<'All' | 'Sports' | 'Politics' | 'Crypto'>('All');

    const filteredEvents = useMemo(() => {
        const politics = politicsEvents.map((e: any) => ({ ...e, category: 'Politics' }));
        const sports = sportsEvents.map((e: any) => ({ ...e, category: 'Sports' }));
        const all = [...politics, ...sports];

        if (activeFilter === 'All') return all;
        return all.filter((e: any) => e.category === activeFilter);
    }, [activeFilter]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <Head>
                <title>SixSeven Events</title>
                <meta name="description" content="Polymarket events data" />
            </Head>


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Politics Section */}
                <div className="mb-16">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Politics</h2>
                        <p className="mt-2 text-lg text-gray-600">Stay updated on global political shifts and upcoming elections.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {politicsFeaturedData.map((event, idx) => (
                            <FeaturedEventCard key={idx} {...event} />
                        ))}
                    </div>
                </div>

                {/* Crypto Section */}
                <div className="mb-16">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Crypto</h2>
                        <p className="mt-2 text-lg text-gray-600">Track the latest trends and price predictions in the crypto space.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {cryptoFeaturedData.map((event, idx) => (
                            <FeaturedEventCard key={idx} {...event} />
                        ))}
                    </div>
                </div>

                {/* Regular Events Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">All Events</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEvents.map((event: any) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </main>
        </div>
    );
}
