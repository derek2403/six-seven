// Script to register enclave with attestation document
// Run with: npx ts-node scripts/register-enclave.ts

import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as fs from 'fs';
import * as path from 'path';

const ENCLAVE_PACKAGE = '0x8b46d0f2d32974451336e0ede960ccd1714d6b9c3580715863bb2e303fa4795a';
const MARKET_PACKAGE = '0x3757c5b83a2d4606659e17a8130cc3022e398cb092830fe93a186171d4d2cdb8';
const ENCLAVE_CONFIG_ID = '0x48e625408db3aa995ed216f9e273956a7cba6e9ac9604a458df493a49591d7e4';

const TEE_URL = 'http://44.211.226.223:3000';

async function main() {
    // Load keypair from Sui config
    const suiConfigPath = path.join(process.env.HOME!, '.sui/sui_config/sui.keystore');
    const keystore: string[] = JSON.parse(fs.readFileSync(suiConfigPath, 'utf-8'));
    const privKey = keystore[0];

    let keypair: Ed25519Keypair;
    if (privKey.startsWith('suiprivkey')) {
        const { secretKey } = decodeSuiPrivateKey(privKey);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        // Assume Base64
        const raw = Buffer.from(privKey, 'base64');
        // First byte is flag (0x00 for Ed25519), skip it
        if (raw[0] !== 0) throw new Error('Invalid key flag');
        const secretKey = new Uint8Array(raw.slice(1));
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    }

    console.log('Using address:', keypair.toSuiAddress());

    // Get attestation from TEE
    console.log('Fetching attestation from TEE...');
    const response = await fetch(`${TEE_URL}/get_attestation`);
    const { attestation } = await response.json();

    console.log('Attestation length:', attestation.length);

    // Convert hex string to bytes
    const attestationBytes: number[] = [];
    for (let i = 0; i < attestation.length; i += 2) {
        attestationBytes.push(parseInt(attestation.substring(i, i + 2), 16));
    }

    console.log('Attestation bytes:', attestationBytes.length);

    // Build transaction
    const tx = new Transaction();

    // 1. Load attestation document
    const [attestationDoc] = tx.moveCall({
        target: '0x2::nitro_attestation::load_nitro_attestation',
        arguments: [
            tx.pure.vector('u8', attestationBytes),
            tx.object('0x6'),
        ],
    });

    // 2. Register enclave with the document
    tx.moveCall({
        target: `${ENCLAVE_PACKAGE}::enclave::register_enclave`,
        typeArguments: [`${MARKET_PACKAGE}::market::MARKET`],
        arguments: [
            tx.object(ENCLAVE_CONFIG_ID),
            attestationDoc,
        ],
    });

    // Execute
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });

    console.log('Transaction digest:', result.digest);
    console.log('Waiting for confirmation...');

    const confirmed = await client.waitForTransaction({ digest: result.digest });
    console.log('Transaction confirmed!');
    console.log('Result:', JSON.stringify(confirmed, null, 2));
}

main().catch(console.error);
