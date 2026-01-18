'use client';

// This component wraps the app with Sui wallet providers
// Must be a client component because it uses React Context

import '@mysten/dapp-kit/dist/index.css';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create QueryClient for react-query
const queryClient = new QueryClient();

// Configure Sui networks (devnet and mainnet)
const networks = {
    testnet: { url: getFullnodeUrl('testnet') },
};

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="testnet">
                <WalletProvider autoConnect>
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}
