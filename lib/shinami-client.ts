/**
 * Shinami Client Configuration
 * 
 * This file initializes the Shinami clients for Gas Station and Node Service.
 * Make sure to set up your environment variables before using these clients:
 * - SHINAMI_GAS_STATION_ACCESS_KEY
 * - SHINAMI_NODE_ACCESS_KEY (optional, can reuse gas station key if it has node access)
 */

import { GasStationClient } from '@shinami/clients/sui';
import { SuiClient } from '@mysten/sui/client';

// Get the network from environment or default to testnet
const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet';

/**
 * Get Shinami Gas Station Client
 * Used for sponsoring transactions
 */
export function getGasStationClient(): GasStationClient {
    const key = process.env.SHINAMI_GAS_STATION_ACCESS_KEY;
    if (!key) {
        throw new Error('SHINAMI_GAS_STATION_ACCESS_KEY is not set');
    }
    return new GasStationClient(key);
}

/**
 * Get Shinami Sui Client (optional - uses Shinami nodes)
 * Falls back to public RPC if key not set
 */
export function getShinamiSuiClient(): SuiClient {
    const key = process.env.SHINAMI_NODE_ACCESS_KEY;

    if (key) {
        return new SuiClient({
            url: `https://api.us1.shinami.com/node/v1/${key}`,
        });
    }

    // Fallback to public RPC
    const rpcUrl = network === 'mainnet'
        ? 'https://fullnode.mainnet.sui.io:443'
        : 'https://fullnode.testnet.sui.io:443';

    return new SuiClient({ url: rpcUrl });
}
