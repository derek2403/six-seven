'use client';

// Component to display connected wallet and owned objects
// Uses Sui dapp-kit hooks for wallet interaction

import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

// Main wallet component - shows connect button and account info
export function WalletConnect() {
    return (
        <div className="flex flex-col items-center gap-8">
            {/* Wallet connect button from dapp-kit */}
            <ConnectButton />

            {/* Show connected account details */}
            <ConnectedAccount />
        </div>
    );
}

// Display connected account address and owned objects
function ConnectedAccount() {
    const account = useCurrentAccount();

    // If no wallet connected, show nothing
    if (!account) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl">
            {/* Display wallet address */}
            <div className="text-lg font-semibold text-center">
                Connected to: {account.address}
            </div>

            {/* Display owned objects */}
            <OwnedObjects address={account.address} />
        </div>
    );
}

// Display list of NFTs/objects owned by the address
function OwnedObjects({ address }: { address: string }) {
    // Query owned objects from Sui blockchain
    const { data } = useSuiClientQuery('getOwnedObjects', {
        owner: address,
    });

    // If no data loaded yet, show nothing
    if (!data) {
        return null;
    }

    return (
        <div className="w-full">
            <h2 className="text-xl font-semibold mb-4">Owned Objects:</h2>
            <ul className="flex flex-col gap-2">
                {data.data.map((object) => (
                    <li
                        key={object.data?.objectId}
                        className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg"
                    >
                        {/* Link to view object on Sui explorer */}
                        <a
                            href={`https://suiscan.xyz/testnet/object/${object.data?.objectId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                            {object.data?.objectId}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}