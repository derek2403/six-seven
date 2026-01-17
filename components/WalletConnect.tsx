'use client';

import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { VaultControls } from './VaultControls';
import { formatBalance } from '../lib/format';
import { LEDGER_ID, parseUserAccountData } from '../lib/vault';

export function WalletConnect() {
    const account = useCurrentAccount();

    // 1. Get Ledger Object to find the accounts table ID
    const { data: ledgerData } = useSuiClientQuery(
        'getObject',
        { id: LEDGER_ID, options: { showContent: true } }
    );

    // Extract accounts table ID
    const accountsTableId = ledgerData?.data?.content && 'fields' in ledgerData.data.content
        ? (ledgerData.data.content.fields as any).accounts?.fields?.id?.id
        : null;

    // 2. Query the user's account from the table using Dynamic Field
    const { data: userAccountData } = useSuiClientQuery(
        'getDynamicFieldObject',
        {
            parentId: accountsTableId || '',
            name: {
                type: 'address',
                value: account?.address || '',
            }
        },
        {
            enabled: !!accountsTableId && !!account?.address,
            refetchInterval: 5000
        }
    );

    const userStats = parseUserAccountData(userAccountData);
    const cashBalance = userStats ? formatBalance(userStats.withdrawable_amount) : '0.00';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white border-b border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            {/* Top Row: Main Header */}
            <div className="flex items-center justify-between px-4 xl:px-24 py-2 h-[60px] border-b border-zinc-100 dark:border-zinc-900">
                {/* Left: Logo and Search */}
                <div className="flex items-center gap-8 flex-1">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        {/* Simple Icon placeholder */}
                        <div className="w-6 h-6 border-2 border-black dark:border-white skew-x-[-15deg]"></div>
                        <span className="text-xl font-bold tracking-tight text-black dark:text-white">SixSeven</span>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-xl relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search markets"
                            className="w-full h-10 pl-10 pr-4 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">/</span>
                    </div>
                </div>

                {/* Right: Stats and Actions */}
                <div className="flex items-center gap-3">
                    {account && (
                        <>
                            {/* Portfolio Stats */}
                            <div className="hidden lg:flex items-center gap-4">
                                <div className="flex flex-col items-end leading-none gap-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Portfolio</span>
                                    <span className="text-[13px] text-[#2ebd85] font-bold font-mono">$0.00</span>
                                </div>
                                <div className="flex flex-col items-end leading-none gap-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Cash</span>
                                    <span className="text-[13px] text-[#2ebd85] font-bold font-mono">${cashBalance}</span>
                                </div>
                            </div>



                            {/* Deposit Button with Vault Controls */}
                            <div className="hidden sm:block">
                                <VaultControls
                                    customTrigger={
                                        <button className="h-[34px] px-6 bg-[#0052ff] hover:bg-[#004ad9] text-white text-[13px] font-bold rounded flex items-center justify-center transition-colors shadow-sm">
                                            Transfer
                                        </button>
                                    }
                                />
                            </div>

                            {/* Notification Bell */}
                            <button className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </button>

                            {/* Divider */}
                            <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
                        </>
                    )}

                    {/* User/Wallet Profile */}
                    <div className="flex items-center">
                        <ConnectButton className="!bg-zinc-100 !text-black !font-semibold !rounded-full !px-3 !py-1.5 !h-[34px] !text-xs hover:!bg-zinc-200" />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Secondary Navigation */}
            <div className="flex items-center px-4 xl:px-24 h-12 overflow-x-auto no-scrollbar gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {/* Primary Filters */}
                <div className="flex items-center gap-6 shrink-0">
                    <button className="flex items-center gap-2 text-black dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                        <span>Trending</span>
                    </button>
                    <button className="hover:text-black dark:hover:text-white">Breaking</button>
                    <button className="hover:text-black dark:hover:text-white">New</button>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 shrink-0 mx-2"></div>

                {/* Categories */}
                <div className="flex items-center gap-6 shrink-0">
                    {['Politics', 'Sports', 'Crypto', 'Finance', 'Geopolitics', 'Earnings', 'Tech', 'Culture', 'World', 'Economy', 'Climate & Science', 'Elections'].map((category) => (
                        <button key={category} className="hover:text-black dark:hover:text-white whitespace-nowrap">
                            {category}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}

// Minimal placeholder for formatting
// In a real app, you would pass custom components to ConnectButton or style it via global CSS
