import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { createListingTx } from '../lib/listing';
import { LISTING_CONFIG } from '../lib/config';
import { Header } from '../components/header';

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
        <>
            <Head>
                <title>Create Listing</title>
            </Head>

            <Header />

            <div className="max-w-4xl mx-auto px-8 pb-8 pt-24 font-sans min-h-screen text-gray-900">
                <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">Create New Listing</h1>

                <div className="flex flex-col gap-8">
                    {/* Category Selection */}
                    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h2 className="text-xl font-semibold mb-5 text-blue-800 border-b border-blue-200 pb-2">Quick Create from Template</h2>

                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-blue-700">Select Category</label>
                            <select
                                className="w-full p-3 rounded-lg border border-blue-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
                            >
                                <option value="">-- Choose a category --</option>
                                <option value="politics">Politics Events</option>
                                <option value="sports">Sports</option>
                            </select>
                        </div>

                        {selectedCategory && (
                            <div className="mt-4">
                                <label className="block mb-3 text-sm font-medium text-blue-700">Select an Event</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {getCategoryOptions().map((event) => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => handleEventSelect(event)}
                                            className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${selectedEvent?.id === event.id
                                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <img
                                                    src={event.image || event.icon}
                                                    alt={event.title}
                                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/64x64?text=?')}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                        {event.description?.slice(0, 100)}...
                                                    </p>
                                                    {event.markets && (
                                                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            {event.markets.length} submarkets
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!selectedCategory && (
                            <p className="text-sm text-gray-500 mt-2">
                                Or fill in the form manually below
                            </p>
                        )}
                    </section>

                    {/* Main Listing Info */}
                    <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-5 text-gray-700 border-b border-gray-200 pb-2">Main Listing Details</h2>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-gray-600">Listing Title</label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Premier League Matchday 1"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-gray-600">Description</label>
                            <textarea
                                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the listing..."
                                rows={3}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-gray-600">Main Image URL</label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </section>

                    {/* Submarkets */}
                    <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-5 text-gray-700 border-b border-gray-200 pb-2">Submarkets (Exactly 3 Required)</h2>

                        {submarkets.map((sub, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
                                <h3 className="text-base font-medium mb-3 text-gray-500">Submarket #{index + 1}</h3>
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-medium text-gray-600">Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={sub.title}
                                        onChange={(e) => handleSubmarketChange(index, 'title', e.target.value)}
                                        placeholder={`Submarket ${index + 1} Title`}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-medium text-gray-600">Image URL</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={sub.image}
                                        onChange={(e) => handleSubmarketChange(index, 'image', e.target.value)}
                                        placeholder={`Submarket ${index + 1} Image URL`}
                                    />
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Action Buttons */}
                    <div className="text-center mt-5">
                        {!currentAccount ? (
                            <p className="text-amber-600 text-lg font-medium">Please connect your wallet to create a listing</p>
                        ) : (
                            <button
                                className="px-12 py-4 rounded-xl border-none bg-blue-600 text-white text-lg font-bold cursor-pointer hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md"
                                onClick={createListing}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Listing'}
                            </button>
                        )}
                    </div>

                    {/* Feedback */}
                    {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-center">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 text-center">{success}</div>}
                </div>

                <div className="mt-16">
                    <CreatedListings />
                </div>
            </div>
        </>
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
