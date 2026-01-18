import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import politicsEvents from '../data/metadata/politics_events.json';
import sportsEvents from '../data/metadata/sports.json';
import { Header } from '../components/header';
import { WalletConnect } from '../components/WalletConnect';
import { Search, SlidersHorizontal, Bookmark, ChevronRight, ChevronDown, Repeat, Gift } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';
import { WORLD_CONFIG } from '@/lib/config';

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

const FeaturedEventCard = ({ title, icon, items, link, showArrow, volume, frequency, showGift, layout = 'default' }: { title: string, icon: string, items: any[], link?: string, showArrow?: boolean, volume?: string, frequency?: string, showGift?: boolean, layout?: 'default' | 'compact' }) => {
    const content = (
        <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full group ${link ? 'cursor-pointer' : ''}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <img
                        src={icon}
                        alt={title}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm"
                    />
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                        {title}
                    </h3>
                </div>
                {(link || showArrow) && (
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
            </div>

            <div className="space-y-6 flex-1">
                {items.map((item, idx) => (
                    <div key={idx} className={layout === 'compact' ? "flex items-center justify-between" : "flex flex-col space-y-3"}>
                        {layout === 'compact' ? (
                            <>
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://polymarket.com/static/error/image-error.png' }}
                                    />
                                    <span className="text-[15px] font-medium text-gray-700 truncate">
                                        {item.title}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg font-bold text-gray-900 mr-1">
                                        {item.yes || 0}%
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[13px] font-semibold py-1.5 px-3 rounded-lg transition-colors">
                                            Yes
                                        </button>
                                        <button className="bg-red-50 hover:bg-red-100 text-red-700 text-[13px] font-semibold py-1.5 px-3 rounded-lg transition-colors">
                                            No
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
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
                                        <span>{item.yes || 0}%</span>
                                    </button>
                                    <div className="w-px bg-gray-100 self-stretch my-2" />
                                    <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex justify-between items-center">
                                        <span>No</span>
                                        <span>{item.no || 0}%</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Card Footer */}
            <div className="mt-auto pt-6 flex items-center justify-between text-[13px] font-semibold text-gray-400">
                <div className="flex items-center space-x-3">
                    <span>{volume || '$0 Vol.'}</span>
                    <div className="flex items-center space-x-1">
                        {showGift ? (
                            <Gift className="w-4 h-4 text-gray-400" />
                        ) : (
                            frequency && (
                                <>
                                    <Repeat className="w-4 h-4" />
                                    <span>{frequency}</span>
                                </>
                            )
                        )}
                    </div>
                </div>
                <Bookmark className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>
        </div>
    );

    if (link) {
        return <Link href={link}>{content}</Link>;
    }
    return content;
};

const politicsFeaturedData = [
    {
        title: "Iran War",
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Flag_of_Iran.svg/1200px-Flag_of_Iran.svg.png",
        link: "/iran",
        volume: "$485m Vol.",
        showGift: true,
        items: [
            { title: "Khamenei Out", image: "/leader.png", yes: 0, no: 0, any: 0 },
            { title: "US strikes Iran", image: "/us-iran.png", yes: 0, no: 0, any: 0 },
            { title: "Israel strikes Iran", image: "/isreal-iran.png", yes: 0, no: 0, any: 0 }
        ]
    },
    {
        title: "Trump Presidency",
        icon: "/market/trump_portrait.png",
        volume: "$1.2b Vol.",
        showGift: true,
        items: [
            { title: "Fed Chair Nominee", image: "/market/fedchair.png", yes: 60, no: 40, any: 0 },
            { title: "Trump Out", image: "/market/trump-out.png", yes: 10, no: 90, any: 0 },
            { title: "Epstein Files", image: "/market/eipstein.png", yes: 30, no: 70, any: 0 }
        ]
    },
    {
        title: "Jan Crypto Hits",
        icon: "/market/crypto-logo.png",
        volume: "$0 Vol.",
        items: [
            { title: "BTC > $98k Jan", image: "/market/btc_logo.png", yes: 0, no: 0, any: 0 },
            { title: "ETH > $3.5k Jan", image: "/market/eth_logo.png", yes: 0, no: 0, any: 0 },
            { title: "Sui > $2.5 Jan", image: "/market/sui-logo1.png", yes: 0, no: 0, any: 0 }
        ]
    }
];

const cryptoFeaturedData = [
    {
        title: "US Elections 2028",
        icon: "/market/pre-winner.png",
        volume: "$920m Vol.",
        frequency: "Monthly",
        items: [
            { title: "GOP House 2028", image: "/market/republic.png", yes: 50, no: 50, any: 0 },
            { title: "Dems Senate 2028", image: "/market/democratic.png", yes: 45, no: 55, any: 0 },
            { title: "JD Vance 2028", image: "/market/jdvance.png", yes: 30, no: 70, any: 0 }
        ]
    },
    {
        title: "Sui January Targets",
        icon: "/market/jan.png",
        volume: "$650m Vol.",
        frequency: "Monthly",
        items: [
            { title: "Sui Active Wallets", image: "/market/slush.png", yes: 58, no: 42, any: 0 },
            { title: "Sui App DAU", image: "/market/btc_logo.png", yes: 45, no: 55, any: 0 },
            { title: "Sui DEX Share", image: "/market/eth_logo.png", yes: 40, no: 60, any: 0 }
        ]
    },
    {
        title: "Sui Ecosystem",
        icon: "/market/sui-coin.png",
        volume: "$210m Vol.",
        frequency: "Weekly",
        items: [
            { title: "Sui $5 Jan", image: "/market/sui-logo1.png", yes: 33, no: 67, any: 0 },
            { title: "Sui TVL $1B", image: "/market/sui-logo1.png", yes: 57, no: 43, any: 0 },
            { title: "Sui 1M DAU", image: "/market/sui-logo1.png", yes: 22, no: 78, any: 0 }
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
                                            <React.Fragment key={idx}>
                                                <button className={`flex-1 ${colorClass} text-sm font-medium py-1.5 px-3 rounded transition-colors flex justify-between items-center w-full`}>
                                                    <span className="truncate mr-1">{outcome}</span>
                                                    <span>{price}%</span>
                                                </button>
                                                {idx < outcomes.length - 1 && (
                                                    <div className="w-px bg-gray-100 self-stretch my-2" />
                                                )}
                                            </React.Fragment>
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

// Topic pills for the scrollable filter bar
const topicPills = [
    "All", "Trump", "Iran", "NFL Playoffs", "Greenland", "Portugal Election",
    "Tariffs", "Fed", "Derivatives", "Venezuela", "Ukraine", "Oscars",
    "Epstein", "Tweet Markets", "Minnesota Unrest", "China", "AI", "Weather",
    "Silver", "Equities", "Primaries", "Midterms", "Movies", "Global Elections",
    "Parlays", "Israel", "Crypto Prices", "Bitcoin", "Commodities"
];

// Category tabs (no icons)
const categoryTabs = [
    "Trending", "Breaking", "New", "Politics", "Sports", "Crypto",
    "Finance", "Geopolitics", "Earnings", "Tech", "Culture", "World",
    "Economy", "Climate & Science", "Elections", "Mentions", "More"
];

export default function DataPage() {
    const [activeFilter, setActiveFilter] = useState<'All' | 'Sports' | 'Politics' | 'Crypto'>('All');
    const [activeTopic, setActiveTopic] = useState('All');
    const [activeCategory, setActiveCategory] = useState('Trending');

    // Sui client for fetching Pool 0 data
    const client = useSuiClient();
    const [iranProbs, setIranProbs] = useState<{ m1: number; m2: number; m3: number }>({ m1: 0, m2: 0, m3: 0 });

    // Fetch Pool 0 probabilities for Iran market
    useEffect(() => {
        const fetchIranData = async () => {
            try {
                // Get World Object
                const worldObj = await client.getObject({
                    id: WORLD_CONFIG.WORLD_ID,
                    options: { showContent: true }
                });

                const poolsTableId = worldObj.data?.content && 'fields' in worldObj.data.content
                    ? (worldObj.data.content.fields as any).pools?.fields?.id?.id
                    : null;

                if (!poolsTableId) return;

                // Get Pool 0
                const poolField = await client.getDynamicFieldObject({
                    parentId: poolsTableId,
                    name: { type: 'u64', value: '0' }
                });

                if (poolField.data?.content && 'fields' in poolField.data.content) {
                    const poolContent = (poolField.data.content.fields as any).value.fields;
                    const probsTableId = poolContent.probabilities?.fields?.id?.id;

                    if (probsTableId) {
                        const probFields = await client.getDynamicFields({ parentId: probsTableId });
                        const probs: Record<string, number> = {};

                        for (const pf of probFields.data) {
                            const pItem = await client.getObject({ id: pf.objectId, options: { showContent: true } });
                            if (pItem.data?.content && 'fields' in pItem.data.content) {
                                const val = (pItem.data.content.fields as any).value;
                                const keyInt = parseInt(pf.name.value as string);
                                const binaryKey = keyInt.toString(2).padStart(3, '0');
                                probs[binaryKey] = parseInt(val) / 100; // Convert basis points to percentage
                            }
                        }

                        // Calculate marginal probabilities for each market
                        // Market 1 (Khamenei Out): Sum of all states where bit 0 = 1 (100, 101, 110, 111)
                        // Market 2 (US Strikes): Sum of all states where bit 1 = 1 (010, 011, 110, 111)
                        // Market 3 (Israel Strikes): Sum of all states where bit 2 = 1 (001, 011, 101, 111)
                        const m1 = (probs['100'] || 0) + (probs['101'] || 0) + (probs['110'] || 0) + (probs['111'] || 0);
                        const m2 = (probs['010'] || 0) + (probs['011'] || 0) + (probs['110'] || 0) + (probs['111'] || 0);
                        const m3 = (probs['001'] || 0) + (probs['011'] || 0) + (probs['101'] || 0) + (probs['111'] || 0);

                        setIranProbs({ m1: Math.round(m1), m2: Math.round(m2), m3: Math.round(m3) });
                    }
                }
            } catch (error) {
                console.error('Error fetching Iran data:', error);
            }
        };

        fetchIranData();
        const interval = setInterval(fetchIranData, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [client]);

    // Dynamic politicsFeaturedData with real Iran probabilities
    const dynamicPoliticsFeaturedData = useMemo(() => [
        {
            title: "Iran War",
            icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Flag_of_Iran.svg/1200px-Flag_of_Iran.svg.png",
            link: "/iran",
            volume: "$485m Vol.",
            showGift: true,
            items: [
                { title: "Khamenei Out", image: "/leader.png", yes: iranProbs.m1, no: 100 - iranProbs.m1, any: 0 },
                { title: "US strikes Iran", image: "/us-iran.png", yes: iranProbs.m2, no: 100 - iranProbs.m2, any: 0 },
                { title: "Israel strikes Iran", image: "/isreal-iran.png", yes: iranProbs.m3, no: 100 - iranProbs.m3, any: 0 }
            ]
        },
        {
            title: "Trump Presidency",
            icon: "/market/trump_portrait.png",
            volume: "$1.2b Vol.",
            showGift: true,
            items: [
                { title: "Fed Chair Nominee", image: "/market/fedchair.png", yes: 60, no: 40, any: 0 },
                { title: "Trump Out", image: "/market/trump-out.png", yes: 10, no: 90, any: 0 },
                { title: "Epstein Files", image: "/market/eipstein.png", yes: 30, no: 70, any: 0 }
            ]
        },
        {
            title: "15 Min Crypto",
            icon: "/market/crypto-logo.png",
            volume: "$0 Vol.",
            items: [
                { title: "Bitcoin 15m", image: "/market/btc_logo.png", yes: 0, no: 0, any: 0 },
                { title: "Ethereum 15m", image: "/market/eth_logo.png", yes: 0, no: 0, any: 0 },
                { title: "Sui 15m", image: "/market/sui-logo1.png", yes: 0, no: 0, any: 0 }
            ]
        }
    ], [iranProbs]);

    const filteredEvents = useMemo(() => {
        const politics = politicsEvents.map((e: any) => ({ ...e, category: 'Politics' }));
        const sports = sportsEvents.map((e: any) => ({ ...e, category: 'Sports' }));
        const all = [...politics, ...sports];

        if (activeFilter === 'All') return all;
        return all.filter((e: any) => e.category === activeFilter);
    }, [activeFilter]);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <Head>
                <title>SixSeven Events</title>
                <meta name="description" content="Polymarket events data" />
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </Head>

            {/* Header */}
            <Header />

            {/* Category Tabs Bar (Top - white background) */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-2 h-10">
                        {/* Scrollable Tabs */}
                        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide mr-4">
                            {categoryTabs.slice(0, -1).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveCategory(tab)}
                                    className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all ${activeCategory === tab
                                        ? 'text-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {tab === 'Trending' && <span className="mr-1">📈</span>}
                                    <span>{tab}</span>
                                </button>
                            ))}
                        </div>

                        {/* Fixed More Tab */}
                        <button
                            onClick={() => setActiveCategory('More')}
                            className={`flex-shrink-0 flex items-center px-3 py-1.5 text-sm font-medium border-l border-gray-100 pl-4 transition-all ${activeCategory === 'More'
                                ? 'text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span>More</span>
                            <ChevronDown className="ml-1 w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Topic Pills Bar (Bottom - white background) */}
            <div className="sticky top-16 z-40 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-4 h-14">
                        {/* Scrollable Topics */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            {topicPills.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setActiveTopic(topic)}
                                    className={`flex-shrink-0 px-3 py-1 rounded text-sm font-medium transition-all ${activeTopic === topic
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>

                        {/* Fixed End Icons */}
                        <div className="flex items-center space-x-5 pl-5 ml-4 flex-shrink-0 bg-white">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center space-x-4">
                                <button className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <Search className="w-5 h-5" />
                                </button>
                                <button className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <SlidersHorizontal className="w-5 h-5" />
                                </button>
                                <Link href="/crypto" className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <Bookmark className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Featured Markets Grid */}
                <div className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {[...dynamicPoliticsFeaturedData, ...cryptoFeaturedData].map((event, idx) => (
                            <FeaturedEventCard
                                key={idx}
                                {...event}
                                showArrow
                                layout="compact"
                            />
                        ))}
                    </div>
                </div>

                {/* Regular Events Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">All Events</h2>
                </div>

                <WalletConnect />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEvents.map((event: any) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </main>
        </div>
    );
}
