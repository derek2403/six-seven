import type { NextApiRequest, NextApiResponse } from 'next';
import { getNoodlesService, CoinUpdateData } from '../../../lib/integrations/noodles/NoodlesMarketStreamService';

// Default coins to fetch if none provided
const DEFAULT_COINS = [
    '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN', // WETH
    '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN', // SOL
    '0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC', // WBTC
];

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const coinIds = (req.query.coins as string)?.split(',') || DEFAULT_COINS;
    const service = getNoodlesService();

    // Initialize the service (connects if not already connected)
    service.initialize(coinIds);

    // If we have cached data, return it immediately
    const cachedData = service.getCachedDataForCoins(coinIds);
    if (cachedData.length > 0) {
        return res.status(200).json({
            success: true,
            data: cachedData,
            status: service.getStatus()
        });
    }

    // No cached data yet - wait for first update (with timeout)
    try {
        const updates = await new Promise<CoinUpdateData[]>((resolve, reject) => {
            const collectedUpdates: CoinUpdateData[] = [];
            const targets = new Set(coinIds);

            // Timeout after 15 seconds if no data
            const timeout = setTimeout(() => {
                cleanup();
                // Return whatever we have, even if empty
                resolve(collectedUpdates);
            }, 15000);

            const onUpdate = (data: CoinUpdateData) => {
                if (targets.has(data.coin)) {
                    collectedUpdates.push(data);
                    targets.delete(data.coin);
                }

                // Return once we have all coins or at least some data
                if (targets.size === 0 || collectedUpdates.length >= coinIds.length) {
                    cleanup();
                    resolve(collectedUpdates);
                }
            };

            const onError = (err: Error) => {
                cleanup();
                reject(err);
            };

            const cleanup = () => {
                clearTimeout(timeout);
                service.removeListener('coinUpdate', onUpdate);
                service.removeListener('error', onError);
            };

            service.on('coinUpdate', onUpdate);
            service.on('error', onError);
        });

        res.status(200).json({
            success: true,
            data: updates,
            status: service.getStatus()
        });

    } catch (error: any) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            status: service.getStatus()
        });
    }
}
