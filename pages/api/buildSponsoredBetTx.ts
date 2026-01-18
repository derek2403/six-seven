/**
 * API Route: Build and Sponsor Bet Transaction
 * 
 * This endpoint:
 * 1. Receives bet transaction parameters from the frontend
 * 2. Builds the complete bet transaction (PM submit_bet + vault updates + world updates)
 * 3. Sponsors it via Shinami Gas Station
 * 4. Returns the sponsored transaction bytes and sponsor signature to the frontend
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { buildGaslessTransaction } from '@shinami/clients/sui';
import { getGasStationClient, getShinamiSuiClient } from '@/lib/shinami-client';
import { PM_CONFIG } from '@/lib/tee';
import { VAULT_CONFIG, WORLD_CONFIG } from '@/lib/config';
import type {
    BuildSponsoredBetTxRequest,
    BuildSponsoredTxResponse,
    SponsoredTxErrorResponse
} from '@/lib/shinami-types';

// Helper to convert hex string to byte array
function fromHex(hex: string): number[] {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return Array.from(bytes);
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BuildSponsoredTxResponse | SponsoredTxErrorResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body: BuildSponsoredBetTxRequest = req.body;
        const {
            sender,
            poolId,
            outcome,
            maker,
            teeResponse,
            teeSignature,
            userNewBalance,
            makerNewBalance
        } = body;

        if (!sender) {
            return res.status(400).json({ error: 'Sender address is required' });
        }

        if (!teeResponse || !teeSignature) {
            return res.status(400).json({ error: 'TEE response and signature are required' });
        }

        const suiClient = getShinamiSuiClient();
        const gasStationClient = getGasStationClient();

        // Build a gasless transaction using Shinami's helper
        const gaslessTx = await buildGaslessTransaction(
            (tx) => {
                // 1. Submit bet to PM contract
                tx.moveCall({
                    target: `${PM_CONFIG.PM_PACKAGE}::pm::submit_bet`,
                    typeArguments: [`${PM_CONFIG.PM_PACKAGE}::pm::PM`],
                    arguments: [
                        tx.object(PM_CONFIG.ENCLAVE_OBJECT_ID),
                        tx.pure.u64(teeResponse.shares),
                        tx.pure.vector('u64', teeResponse.newProbs),
                        tx.pure.u64(poolId),
                        tx.pure.u8(outcome),
                        tx.pure.u64(teeResponse.debitAmount),
                        tx.pure.u64(teeResponse.creditAmount),
                        tx.pure.u64(teeResponse.timestampMs),
                        tx.pure.vector('u8', fromHex(teeSignature)),
                    ],
                });

                // 2. Update User Balance (debit)
                tx.moveCall({
                    target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::set_withdrawable_balance`,
                    arguments: [
                        tx.object(VAULT_CONFIG.LEDGER_ID),
                        tx.pure.address(sender),
                        tx.pure.u64(BigInt(userNewBalance)),
                    ],
                });

                // 3. Update Maker Balance (credit)
                tx.moveCall({
                    target: `${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::set_withdrawable_balance`,
                    arguments: [
                        tx.object(VAULT_CONFIG.LEDGER_ID),
                        tx.pure.address(maker),
                        tx.pure.u64(BigInt(makerNewBalance)),
                    ],
                });

                // 4. Update World Probabilities
                tx.moveCall({
                    target: `${WORLD_CONFIG.PACKAGE_ID}::${WORLD_CONFIG.MODULE_NAME}::update_prob`,
                    arguments: [
                        tx.object(WORLD_CONFIG.WORLD_ID),
                        tx.pure.u64(poolId),
                        tx.pure.vector('u64', teeResponse.newProbs),
                    ],
                });
            },
            { sui: suiClient }
        );

        // Set the sender
        gaslessTx.sender = sender;

        // Sponsor the transaction via Shinami Gas Station
        const sponsoredResponse = await gasStationClient.sponsorTransaction(gaslessTx);

        // Return the sponsored transaction and signature to the frontend
        const response: BuildSponsoredTxResponse = {
            txBytes: sponsoredResponse.txBytes,
            sponsorSignature: sponsoredResponse.signature,
            digest: sponsoredResponse.txDigest,
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error building/sponsoring bet transaction:', error);

        return res.status(500).json({
            error: 'Failed to build or sponsor transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
