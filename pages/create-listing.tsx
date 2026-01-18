import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { createListingTx } from '../lib/listing';
import { LISTING_CONFIG } from '../lib/config';
import { Header } from '../components/Header';

// Import JSON data
import politicsEventsData from '../data/metadata/politics_events.json';
import sportsData from '../data/metadata/sports.json';

// Define types for the data structure
interface Market {
    id: string;
    question: string;
    image?: string;
    icon?: string;
    groupItemTitle?: string;
}

interface EventData {
    id: string;
    title: string;
    description: string;
    image: string;
    icon?: string;
    markets?: Market[];
}

// Pre-select 2 main listings from each category (high liquidity/notable events)
const POLITICS_OPTIONS: EventData[] = [
    politicsEventsData[0], // First event from politics
    politicsEventsData[1]  // Second event from politics
].filter(Boolean) as EventData[];

const SPORTS_OPTIONS: EventData[] = [
    sportsData[0], // First event from sports
    sportsData[1]  // Second event from sports
].filter(Boolean) as EventData[];

type CategoryType = '' | 'politics' | 'sports';

export default function CreateListing() {
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Category Selection State
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('');
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [submarkets, setSubmarkets] = useState([
        { title: '', image: '' },
        { title: '', image: '' },
        { title: '', image: '' }
    ]);

    // Get options based on selected category
    const getCategoryOptions = () => {
        if (selectedCategory === 'politics') return POLITICS_OPTIONS;
        if (selectedCategory === 'sports') return SPORTS_OPTIONS;
        return [];
    };

    // Handle event selection - auto-fill form
    const handleEventSelect = (event: EventData) => {
        setSelectedEvent(event);
        setTitle(event.title);
        setDescription(event.description);
        setImageUrl(event.image || event.icon || '');

        // Extract submarkets from the event's markets array (first 3)
        if (event.markets && event.markets.length >= 3) {
            const newSubmarkets = event.markets.slice(0, 3).map(market => ({
                title: market.groupItemTitle || market.question || '',
                image: market.image || market.icon || event.image || ''
            }));
            setSubmarkets(newSubmarkets);
        } else if (event.markets && event.markets.length > 0) {
            // Fill available markets and keep empty for the rest
            const newSubmarkets = [
                { title: '', image: '' },
                { title: '', image: '' },
                { title: '', image: '' }
            ];
            event.markets.forEach((market, idx) => {
                if (idx < 3) {
                    newSubmarkets[idx] = {
                        title: market.groupItemTitle || market.question || '',
                        image: market.image || market.icon || event.image || ''
                    };
                }
            });
            setSubmarkets(newSubmarkets);
        }
    };

    // Reset form when category changes
    const handleCategoryChange = (category: CategoryType) => {
        setSelectedCategory(category);
        setSelectedEvent(null);
        if (!category) {
            // Reset form if no category selected
            setTitle('');
            setDescription('');
            setImageUrl('');
            setSubmarkets([
                { title: '', image: '' },
                { title: '', image: '' },
                { title: '', image: '' }
            ]);
        }
    };

    const handleSubmarketChange = (index: number, field: 'title' | 'image', value: string) => {
        const newSubmarkets = [...submarkets];
        newSubmarkets[index][field] = value;
        setSubmarkets(newSubmarkets);
    };

    const createListing = async () => {
        if (!currentAccount) {
            setError('Please connect your wallet first');
            return;
        }

        if (!title || !description || !imageUrl || submarkets.some(s => !s.title || !s.image)) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const tx = createListingTx({
                title,
                description,
                imageUrl,
                submarkets
            });

            const result = await signAndExecuteTransaction({
                transaction: tx,
            });

            console.log('Listing created:', result);
            setSuccess(`Listing created successfully! Digest: ${result.digest}`);

            // Reset form
            setTitle('');
            setDescription('');
            setImageUrl('');
            setSubmarkets([
                { title: '', image: '' },
                { title: '', image: '' },
                { title: '', image: '' }
            ]);

        } catch (err: any) {
            console.error('Error creating listing:', err);
            setError(err.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 font-sans text-slate-900">
            <Head>
                <title>Create Listing | Phōcast</title>
            </Head>

            <Header />

            <main className="max-w-2xl mx-auto px-6 py-12 pt-24">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2 mt-6">Create New Listing</h1>
                    <p className="text-slate-500">Launch a new prediction market on Phōcast</p>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Category Selection Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">1. Choose Correlated Events</h2>
                                <p className="text-xs text-slate-500">Start from a preset or custom event</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-medium text-slate-700">Category</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                    value={selectedCategory}
                                    onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
                                >
                                    <option value="">Select a category...</option>
                                    <option value="politics">Politics Events</option>
                                    <option value="sports">Sports</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <label className="block mb-3 text-sm font-medium text-slate-700">Select Event</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {getCategoryOptions().map((event) => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => handleEventSelect(event)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 group ${selectedEvent?.id === event.id
                                                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                                : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <img
                                                src={event.image || event.icon}
                                                alt={event.title}
                                                className="w-12 h-12 object-cover rounded-lg bg-slate-200"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/48x48?text=?')}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold truncate ${selectedEvent?.id === event.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                                    {event.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                    {event.description?.slice(0, 100)}...
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">2. Listing Details</h2>
                                <p className="text-xs text-slate-500">Define the main event information</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. US Election 2024"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 min-h-[100px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the event and resolution criteria..."
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">Image URL</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                    {imageUrl && (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submarkets Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18"></path>
                                    <path d="m19 9-5 5-4-4-3 3"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">3. Outcomes</h2>
                                <p className="text-xs text-slate-500">Define exactly 3 mutually exclusive outcomes</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {submarkets.map((sub, index) => (
                                <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Outcome #{index + 1}</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                            value={sub.title}
                                            onChange={(e) => handleSubmarketChange(index, 'title', e.target.value)}
                                            placeholder={`Outcome Title (e.g. Yes/No/Maybe)`}
                                        />
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                            value={sub.image}
                                            onChange={(e) => handleSubmarketChange(index, 'image', e.target.value)}
                                            placeholder="Image URL (optional)"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-4">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm text-center font-medium animate-in fade-in slide-in-from-top-1 break-all">
                                {success}
                            </div>
                        )}

                        {!currentAccount ? (
                            <button disabled className="w-full py-4 rounded-xl bg-slate-100 text-slate-400 font-bold border-2 border-slate-200 cursor-not-allowed">
                                Connect Wallet to Continue
                            </button>
                        ) : (
                            <button
                                className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
                                onClick={createListing}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Listing...
                                    </span>
                                ) : 'Create Listing'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-16">
                    <CreatedListings />
                </div>
            </main>
        </div>
    );
}

function CreatedListings() {
    const suiClient = useSuiClient();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Helper to clean Google Image URLs
    const cleanImageUrl = (url: string) => {
        if (!url) return '';
        try {
            if (url.includes('google.com/imgres')) {
                const urlObj = new URL(url);
                const imgurl = urlObj.searchParams.get('imgurl');
                if (imgurl) return decodeURIComponent(imgurl);
            }
            return url;
        } catch (e) {
            return url;
        }
    };

    const fetchListings = async () => {
        setLoading(true);
        try {
            // 1. Find transactions that called create_listing
            const txs = await suiClient.queryTransactionBlocks({
                filter: {
                    MoveFunction: {
                        package: LISTING_CONFIG.PACKAGE_ID,
                        module: LISTING_CONFIG.MODULE_NAME,
                        function: 'create_listing'
                    }
                },
                options: {
                    showEffects: true,
                    showInput: true,
                },
                order: 'descending',
                limit: 10
            });

            // 2. Extract created object IDs
            const objectIds = txs.data.flatMap(tx => {
                return tx.effects?.created?.map(c => c.reference.objectId) || [];
            });

            if (objectIds.length === 0) {
                setListings([]);
                return;
            }

            // 3. Fetch object details
            const objects = await suiClient.multiGetObjects({
                ids: objectIds,
                options: { showContent: true }
            });

            // 4. Parse listings
            const parsedListings = objects.map(obj => {
                if (obj.data?.content && 'fields' in obj.data.content) {
                    const fields = obj.data.content.fields as any;
                    console.log('Raw Listing Fields:', fields);

                    // Handle submarkets: they might be wrapped in 'fields' if they are structs
                    const submarkets = Array.isArray(fields.submarkets)
                        ? fields.submarkets.map((sub: any) => {
                            // If sub has 'fields', use it. Otherwise use sub directly.
                            const subFields = sub.fields ? sub.fields : sub;
                            return {
                                title: subFields.title,
                                image_url: subFields.image_url
                            };
                        })
                        : [];

                    return {
                        id: obj.data.objectId,
                        title: fields.title,
                        description: fields.description,
                        imageUrl: fields.image_url,
                        submarkets: submarkets
                    };
                }
                return null;
            }).filter(l => l !== null);

            console.log('Parsed Listings:', parsedListings);
            setListings(parsedListings);

        } catch (err) {
            console.error('Error fetching listings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [suiClient]);

    return (
        <section className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recently Created Listings</h2>
                <button
                    onClick={fetchListings}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading listings...</div>
            ) : listings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No listings found. Create one above!</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.map(listing => (
                        <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            {/* Main Listing Header */}
                            <div className="relative h-48 bg-gray-100">
                                <img
                                    src={cleanImageUrl(listing.imageUrl)}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image')}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <h3 className="text-white font-bold text-xl truncate">{listing.title}</h3>
                                    {listing.description && (
                                        <p className="text-gray-200 text-sm truncate mt-1">{listing.description}</p>
                                    )}
                                    <p className="text-gray-300 text-xs font-mono mt-1">{listing.id.slice(0, 10)}...</p>
                                </div>
                            </div>

                            {/* Submarkets */}
                            <div className="p-4 bg-gray-50">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Submarkets</h4>
                                <div className="space-y-3">
                                    {listing.submarkets.map((sub: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200">
                                            <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={cleanImageUrl(sub.image_url)}
                                                    alt={sub.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error(`Failed to load submarket image: ${sub.image_url}`);
                                                        e.currentTarget.src = 'https://placehold.co/100x100?text=?';
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 truncate">{sub.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
