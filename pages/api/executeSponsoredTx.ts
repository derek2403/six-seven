/**
 * API Route: Execute Sponsored Transaction
 * 
 * This endpoint:
 * 1. Receives a sponsored transaction and both signatures (sponsor + sender)
 * 2. Submits the transaction to the Sui network
 * 3. Returns the transaction response
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type {
    ExecuteSponsoredTxRequest,
    ExecuteSponsoredTxResponse,
    SponsoredTxErrorResponse
} from '@/lib/shinami-types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ExecuteSponsoredTxResponse | SponsoredTxErrorResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body: ExecuteSponsoredTxRequest = req.body;
        const { txBytes, sponsorSignature, senderSignature } = body;

        if (!txBytes || !sponsorSignature || !senderSignature) {
            return res.status(400).json({
                error: 'Transaction bytes, sponsor signature, and sender signature are all required'
            });
        }

        // Use public testnet RPC for execution (more reliable for submission)
        const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

        // Execute the transaction with both signatures
        const result = await suiClient.executeTransactionBlock({
            transactionBlock: txBytes,
            signature: [senderSignature, sponsorSignature],
            options: {
                showEffects: true,
                showEvents: true,
                showObjectChanges: true,
            },
        });

        const response: ExecuteSponsoredTxResponse = {
            ...result,
            digest: result.digest,
            effects: result.effects,
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error executing transaction:', error);

        return res.status(500).json({
            error: 'Failed to execute transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
