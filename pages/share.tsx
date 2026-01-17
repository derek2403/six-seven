import { useState, useMemo } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import { getBasket, type Selection, type Outcome, ALL_CORNERS } from '../lib/market';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function SharePage() {
    // State for user selection
    const [selection, setSelection] = useState<Selection>({
        A: 'any',
        B: 'any',
        C: 'any'
    });

    // Calculate basket based on selection
    const basket = useMemo(() => getBasket(selection), [selection]);

    // Handler for dropdown changes
    const handleChange = (key: keyof Selection, value: Outcome) => {
        setSelection(prev => ({ ...prev, [key]: value }));
    };

    // Copy JSON handler
    const handleCopy = () => {
        const json = JSON.stringify(basket, null, 2);
        navigator.clipboard.writeText(json);
        alert('Basket JSON copied to clipboard!');
    };

    return (
        <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black text-zinc-900 dark:text-zinc-100`}>
            <main className="mx-auto max-w-3xl">
                <header className="mb-12 text-center">
                    <h1 className="text-3xl font-bold mb-2">Corner Market Explorer</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Define contracts over 3 binary events (A, B, C) and see the implied corner shares.
                    </p>
                </header>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Controls Section */}
                    <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="text-xl font-semibold">Define Contract</h2>

                        <div className="space-y-4">
                            <ControlRow label="Event A" value={selection.A} onChange={(v) => handleChange('A', v)} />
                            <ControlRow label="Event B" value={selection.B} onChange={(v) => handleChange('B', v)} />
                            <ControlRow label="Event C" value={selection.C} onChange={(v) => handleChange('C', v)} />
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">Implied Type:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                                    ${basket.type === 'corner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                        basket.type === 'slice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                            basket.type === 'marginal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                    }`}>
                                    {basket.type}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {/* Required Shares */}
                        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">Required Basket</h2>
                                <button
                                    onClick={handleCopy}
                                    className="text-xs px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Copy JSON
                                </button>
                            </div>

                            <div className="min-h-[60px] flex flex-wrap gap-2">
                                {basket.corners.length > 0 ? (
                                    basket.corners.map(corner => (
                                        <span key={corner} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-sm border border-zinc-200 dark:border-zinc-700">
                                            {corner}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-zinc-400 italic">No corners selected</span>
                                )}
                            </div>
                            <div className="mt-2 text-xs text-zinc-500 text-right">
                                Total Shares: {basket.corners.length} / 8
                            </div>
                        </div>

                        {/* Vector Table */}
                        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-zinc-500">Corner</th>
                                        <th className="px-4 py-2 text-right font-medium text-zinc-500">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {ALL_CORNERS.map(corner => {
                                        const isActive = basket.quantities[corner] === 1;
                                        return (
                                            <tr key={corner} className={isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                                                <td className="px-4 py-2 font-mono text-zinc-600 dark:text-zinc-400">
                                                    {corner}
                                                    <span className="ml-2 text-xs text-zinc-400 opacity-50">
                                                        ({corner.split('').map(b => b === '1' ? 'Y' : 'N').join('')})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <span className={`font-mono font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-300 dark:text-zinc-700'}`}>
                                                        {basket.quantities[corner]}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper component for dropdown rows
function ControlRow({ label, value, onChange }: { label: string, value: Outcome, onChange: (v: Outcome) => void }) {
    return (
        <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as Outcome)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
                <option value="any">Any (*)</option>
                <option value="yes">Yes (1)</option>
                <option value="no">No (0)</option>
            </select>
        </div>
    );
}
