import React from 'react';
import Head from 'next/head';
import allEvents from '../data/metadata/all_events.json';

// Helper to parse JSON strings that might be in the data
const safeParse = (str: string) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return [];
    }
};

const formatMoney = (amount: number) => {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}m`;
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
};

const EventCard = ({ event }: { event: any }) => {
    // Use the first market for the main display if available, or aggregate
    // The picture shows some cards with multiple rows (outcomes).
    // We'll iterate through markets or outcomes.

    // Flatten markets to get all outcomes if needed, or just show the first market's outcomes.
    // For the "Portugal" example, it looks like one event with multiple outcomes/candidates.
    // In Polymarket data, often one event has one market with "Yes/No", or multiple markets for candidates.
    // Let's check the structure. If 'markets' has multiple items, we list them?
    // Or if one market has multiple outcomes?

    // In the JSON provided:
    // "markets": [ { "outcomes": "[\"Yes\", \"No\"]", ... } ]
    // It seems mostly Yes/No markets.

    // Let's try to handle both single Yes/No and multiple options if possible, 
    // but based on the JSON snippet, they look like Yes/No markets.
    // If an event has multiple markets (like "Who will Trump nominate..."), we should show them.

    const marketsToDisplay = event.markets.slice(0, 3); // Limit to 3 for space

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                        <img
                            src={event.image || event.icon}
                            alt={event.title}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://polymarket.com/static/error/image-error.png' }}
                        />
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-3 leading-tight">
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

                                <div className="flex space-x-1 w-full">
                                    {outcomes.map((outcome: string, idx: number) => {
                                        const price = prices && prices[idx] ? Math.round(parseFloat(prices[idx]) * 100) : 0;
                                        const isYesOrUp = outcome === 'Yes' || outcome === 'Up';
                                        const isNoOrDown = outcome === 'No' || outcome === 'Down';

                                        let colorClass = "bg-gray-50 hover:bg-gray-100 text-gray-700";
                                        if (isYesOrUp) colorClass = "bg-emerald-50 hover:bg-emerald-100 text-emerald-700";
                                        if (isNoOrDown) colorClass = "bg-red-50 hover:bg-red-100 text-red-700";

                                        return (
                                            <button key={idx} className={`flex-1 ${colorClass} text-sm font-medium py-1.5 px-3 rounded transition-colors flex justify-between items-center`}>
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
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <Head>
                <title>Polymarket Events</title>
                <meta name="description" content="Polymarket events data" />
            </Head>

            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span className="text-xl font-bold tracking-tight">Polymarket</span>
                        <div className="hidden md:flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <span className="px-3 py-1 bg-white shadow-sm rounded-md text-sm font-medium">All</span>
                            <span className="px-3 py-1 text-gray-500 text-sm font-medium">Sports</span>
                            <span className="px-3 py-1 text-gray-500 text-sm font-medium">Politics</span>
                            <span className="px-3 py-1 text-gray-500 text-sm font-medium">Crypto</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-emerald-600 font-medium">$12.17</span>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Deposit</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allEvents.map((event: any) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </main>
        </div>
    );
}
