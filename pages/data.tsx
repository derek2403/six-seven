import { useState, useMemo } from 'react';
import Image from 'next/image';
import eventsData from '../data/metadata/all_events.json';

// Type definitions for the event data
interface Market {
    id: string;
    question: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    volumeNum?: number;
}

interface EventData {
    id: string;
    title: string;
    description: string;
    image: string;
    icon: string;
    volume: number;
    volume24hr: number;
    category: string;
    closed: boolean;
    active: boolean;
    markets: Market[];
    endDate: string;
}

// Helper to format volume
const formatVolume = (volume: number): string => {
    if (volume >= 1_000_000_000) {
        return `$${(volume / 1_000_000_000).toFixed(1)}B`;
    }
    if (volume >= 1_000_000) {
        return `$${(volume / 1_000_000).toFixed(1)}m`;
    }
    if (volume >= 1_000) {
        return `$${(volume / 1_000).toFixed(0)}k`;
    }
    return `$${volume.toFixed(0)}`;
};

// Helper to parse outcome prices
const parseOutcomePrices = (outcomePrices: string): number[] => {
    try {
        const parsed = JSON.parse(outcomePrices);
        return parsed.map((price: string) => parseFloat(price) * 100);
    } catch {
        return [50, 50];
    }
};

// Helper to parse outcomes
const parseOutcomes = (outcomes: string): string[] => {
    try {
        return JSON.parse(outcomes);
    } catch {
        return ['Yes', 'No'];
    }
};

// Event Card Component
interface EventCardProps {
    event: EventData;
}

const EventCard = ({ event }: EventCardProps) => {
    const market = event.markets?.[0];
    const hasMultipleMarkets = event.markets && event.markets.length > 1;

    if (!market) return null;

    const outcomes = parseOutcomes(market.outcomes);
    const prices = parseOutcomePrices(market.outcomePrices);
    const isYesNo = outcomes.length === 2 && outcomes[0] === 'Yes' && outcomes[1] === 'No';
    const isBinaryChoice = outcomes.length === 2 && !isYesNo;
    const yesPrice = prices[0] || 0;
    const noPrice = prices[1] || 0;

    // Multi-option market display (like "Who will Trump nominate...")
    if (hasMultipleMarkets) {
        return (
            <div className="bg-[#1c2028] rounded-xl p-4 hover:bg-[#252a35] transition-all cursor-pointer border border-[#2a3040] group">
                <div className="flex items-start gap-3 mb-4">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a3040]">
                        {event.icon && (
                            <Image
                                src={event.icon}
                                alt={event.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        )}
                    </div>
                    <h3 className="text-white font-medium text-sm leading-tight flex-1 line-clamp-2">
                        {event.title}
                    </h3>
                </div>

                <div className="space-y-2 mb-4">
                    {event.markets.slice(0, 3).map((m, idx) => {
                        const mPrices = parseOutcomePrices(m.outcomePrices);
                        const mainPrice = Math.max(...mPrices);
                        const mOutcomes = parseOutcomes(m.outcomes);
                        return (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 truncate max-w-[140px]">
                                    {m.question.length > 25 ? m.question.substring(0, 25) + '...' : m.question}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{mainPrice.toFixed(0)}%</span>
                                    <div className="flex gap-1">
                                        <button className="px-2 py-0.5 bg-[#2a6b4f]/30 text-[#4ade80] rounded text-xs hover:bg-[#2a6b4f]/50">
                                            Yes
                                        </button>
                                        <button className="px-2 py-0.5 bg-[#6b2a2a]/30 text-[#f87171] rounded text-xs hover:bg-[#6b2a2a]/50">
                                            No
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#2a3040]">
                    <span>{formatVolume(event.volume)} Vol.</span>
                    <button className="text-gray-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // Binary Yes/No market with chance display
    if (isYesNo) {
        return (
            <div className="bg-[#1c2028] rounded-xl p-4 hover:bg-[#252a35] transition-all cursor-pointer border border-[#2a3040] group">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a3040]">
                            {event.icon && (
                                <Image
                                    src={event.icon}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            )}
                        </div>
                        <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                            {event.title}
                        </h3>
                    </div>
                    <div className="flex flex-col items-center ml-2">
                        <span className="text-2xl font-bold text-white">{yesPrice.toFixed(0)}%</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">chance</span>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <button className="flex-1 py-2 bg-[#2a6b4f] hover:bg-[#358a5f] text-white rounded-lg font-medium text-sm transition-colors">
                        Yes
                    </button>
                    <button className="flex-1 py-2 bg-[#6b2a3a] hover:bg-[#8a3548] text-white rounded-lg font-medium text-sm transition-colors">
                        No
                    </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>{formatVolume(event.volume)} Vol.</span>
                        {event.volume24hr > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Daily
                                </span>
                            </>
                        )}
                    </div>
                    <button className="text-gray-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // Binary choice market (e.g., Team A vs Team B)
    if (isBinaryChoice) {
        return (
            <div className="bg-[#1c2028] rounded-xl p-4 hover:bg-[#252a35] transition-all cursor-pointer border border-[#2a3040] group">
                <div className="flex items-start gap-3 mb-4">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a3040]">
                        {event.icon && (
                            <Image
                                src={event.icon}
                                alt={event.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        )}
                    </div>
                    <h3 className="text-white font-medium text-sm leading-tight flex-1 line-clamp-2">
                        {event.title}
                    </h3>
                </div>

                <div className="space-y-2 mb-4">
                    {outcomes.map((outcome, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">{outcome}</span>
                            <span className="text-white font-semibold">{prices[idx]?.toFixed(0) || 0}%</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        className="flex-1 py-2 bg-[#3b5998] hover:bg-[#4a6db5] text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        {outcomes[0]?.substring(0, 10) || 'Option 1'}
                    </button>
                    <button
                        className="flex-1 py-2 bg-[#e85d04] hover:bg-[#f97316] text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        {outcomes[1]?.substring(0, 10) || 'Option 2'}
                    </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#2a3040]">
                    <span>{formatVolume(event.volume)} Vol.</span>
                    <span>{event.category}</span>
                </div>
            </div>
        );
    }

    // Default card
    return (
        <div className="bg-[#1c2028] rounded-xl p-4 hover:bg-[#252a35] transition-all cursor-pointer border border-[#2a3040] group">
            <div className="flex items-start gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a3040]">
                    {event.icon && (
                        <Image
                            src={event.icon}
                            alt={event.title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    )}
                </div>
                <h3 className="text-white font-medium text-sm leading-tight flex-1 line-clamp-2">
                    {event.title}
                </h3>
                <div className="flex flex-col items-center ml-2">
                    <span className="text-xl font-bold text-white">{yesPrice.toFixed(0)}%</span>
                    <span className="text-[10px] text-gray-500">chance</span>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <button className="flex-1 py-2 bg-[#2a6b4f] hover:bg-[#358a5f] text-white rounded-lg font-medium text-sm transition-colors">
                    Yes
                </button>
                <button className="flex-1 py-2 bg-[#6b2a3a] hover:bg-[#8a3548] text-white rounded-lg font-medium text-sm transition-colors">
                    No
                </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatVolume(event.volume)} Vol.</span>
                <button className="text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Category tags for filtering
const CATEGORIES = ['All', 'Politics', 'Sports', 'Crypto', 'Finance', 'Tech', 'Culture', 'World'];

export default function DataPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique categories from data
    const uniqueCategories = useMemo(() => {
        const cats = new Set<string>();
        (eventsData as EventData[]).forEach((event) => {
            if (event.category) cats.add(event.category);
        });
        return ['All', ...Array.from(cats)];
    }, []);

    // Filter events
    const filteredEvents = useMemo(() => {
        let events = eventsData as EventData[];

        if (selectedCategory !== 'All') {
            events = events.filter(event => event.category === selectedCategory);
        }

        if (searchQuery) {
            events = events.filter(event =>
                event.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort by volume (highest first) and limit to 50 for performance
        return events
            .sort((a, b) => (b.volume || 0) - (a.volume || 0))
            .slice(0, 50);
    }, [selectedCategory, searchQuery]);

    return (
        <div className="min-h-screen bg-[#0f1116]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0f1116] border-b border-[#2a3040]">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">67</span>
                            </div>
                            <span className="text-white font-semibold text-lg hidden sm:block">Six-Seven</span>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#1c2028] text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 border border-[#2a3040] focus:border-purple-500 focus:outline-none transition-colors"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">/</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium text-sm transition-all">
                                Connect Wallet
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Navigation */}
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
                        {uniqueCategories.slice(0, 12).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                        ? 'bg-white text-black'
                                        : 'text-gray-400 hover:text-white hover:bg-[#1c2028]'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Stats Bar */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-semibold text-lg">
                        {selectedCategory === 'All' ? 'Trending Events' : selectedCategory}
                    </h2>
                    <span className="text-gray-500 text-sm">{filteredEvents.length} events</span>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>

                {/* Empty State */}
                {filteredEvents.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-gray-500 text-lg mb-2">No events found</div>
                        <p className="text-gray-600 text-sm">Try adjusting your search or filters</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-[#2a3040] mt-8">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">Powered by Polymarket Data</span>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">About</a>
                            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms</a>
                            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
