// Script to register enclave with attestation document
// Run with: npx ts-node scripts/register-enclave.ts

import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as fs from 'fs';
import * as path from 'path';

// Synced with lib/pm.ts
const ENCLAVE_PACKAGE = '0x3a0c541676d4844f1296e92b28163ea079f45b77867599724f141322ff3e8a41';
const MARKET_PACKAGE = '0x327d01aa4fdc8cba53596b225510a6b5afc5d2266227654574fe6347a45d3973';
const ENCLAVE_CONFIG_ID = '0x15a2d73dbecf428e2856ff88db6648bb7bb6716129b2c8347c9ff50e6b4163e5';

const TEE_URL = 'http://100.24.10.33:3000';

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
    // Get PK from TEE health check
    console.log('Fetching PK from TEE health check...');
    const pkResponse = await fetch(`${TEE_URL}/health_check`);
    const { pk } = await pkResponse.json();
    console.log('Enclave PK:', pk);

    // Convert hex string to bytes
    const pkBytes: number[] = [];
    for (let i = 0; i < pk.length; i += 2) {
        pkBytes.push(parseInt(pk.substring(i, i + 2), 16));
    }

    // Build transaction
    const tx = new Transaction();

    // Register enclave with raw PK (Debug Mode)
    tx.moveCall({
        target: `${ENCLAVE_PACKAGE}::enclave::register_enclave_debug`,
        typeArguments: [`${MARKET_PACKAGE}::pm::PM`],
        arguments: [
            tx.object(ENCLAVE_CONFIG_ID),
            tx.pure.vector('u8', pkBytes),
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
