// Script to update EnclaveConfig PCRs to production values
// Run with: npx ts-node scripts/update-pcrs.ts

import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as fs from 'fs';
import * as path from 'path';

// Package and config IDs
const ENCLAVE_PACKAGE = '0x8b46d0f2d32974451336e0ede960ccd1714d6b9c3580715863bb2e303fa4795a';
const MARKET_PACKAGE = '0x3757c5b83a2d4606659e17a8130cc3022e398cb092830fe93a186171d4d2cdb8';
const ENCLAVE_CONFIG_ID = '0x48e625408db3aa995ed216f9e273956a7cba6e9ac9604a458df493a49591d7e4';
const CAP_OBJECT_ID = '0x27a156c53759c77df780d1835d2e6b9ba2b5d3939fcac9cb54412c4a19bca0f0';

// Production PCRs from docker build - UPDATED to match current enclave
const PCR0 = 'dd9752ce3a4eb3dc1052c5b8bd43b72764e9cee8e8a6d0615de403cba3a73b21cf499ca7523d04a14a2d4e8932cc6230';
const PCR1 = 'dd9752ce3a4eb3dc1052c5b8bd43b72764e9cee8e8a6d0615de403cba3a73b21cf499ca7523d04a14a2d4e8932cc6230';
const PCR2 = '21b9efbc184807662e966d34f390821309eeac6802309798826296bf3e8bec7c10edb30948c90ba67310f7b964fc500a';

function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
}

async function main() {
    // Load keypair
    const suiConfigPath = path.join(process.env.HOME!, '.sui/sui_config/sui.keystore');
    const keystore: string[] = JSON.parse(fs.readFileSync(suiConfigPath, 'utf-8'));
    const privKey = keystore[0];

    let keypair: Ed25519Keypair;
    if (privKey.startsWith('suiprivkey')) {
        const { secretKey } = decodeSuiPrivateKey(privKey);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        const raw = Buffer.from(privKey, 'base64');
        if (raw[0] !== 0) throw new Error('Invalid key flag');
        keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(raw.slice(1)));
    }

    console.log('Using address:', keypair.toSuiAddress());
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    // Build transaction
    const tx = new Transaction();
    tx.setGasBudget(100000000);

    tx.moveCall({
        target: `${ENCLAVE_PACKAGE}::enclave::update_pcrs`,
        typeArguments: [`${MARKET_PACKAGE}::market::MARKET`],
        arguments: [
            tx.object(ENCLAVE_CONFIG_ID),
            tx.object(CAP_OBJECT_ID),
            tx.pure.vector('u8', hexToBytes(PCR0)),
            tx.pure.vector('u8', hexToBytes(PCR1)),
            tx.pure.vector('u8', hexToBytes(PCR2)),
        ],
    });

    console.log('Updating PCRs...');
    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });

    console.log('Transaction digest:', result.digest);
    const confirmed = await client.waitForTransaction({ digest: result.digest });
    console.log('PCRs updated successfully!');
    console.log('Now run: npx ts-node scripts/register-enclave.ts');
}

main().catch(console.error);
