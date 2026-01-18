// Script to register enclave with PM using debug registration
// Run with: npx ts-node scripts/register-pm-enclave.ts

import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as fs from 'fs';
import * as path from 'path';
import { PM_CONFIG } from '../lib/tee';

// Health check returns:
// {"pk":"8715fd210f51229da1469a14d91de5a105b7665dc9dfbbc944ebfaaa1d24c89b", ...}
const TEE_PK_HEX = PM_CONFIG.TEE_PK || '';

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

    if (!TEE_PK_HEX) {
        console.error("Please update TEE_PK in lib/pm.ts first!");
        return;
    }

    // Build transaction
    const tx = new Transaction();

    // Call debug registration (no attestation needed)
    // module: enclave::enclave
    // function: register_enclave_debug
    tx.moveCall({
        target: `${PM_CONFIG.ENCLAVE_PACKAGE}::enclave::register_enclave_debug`,
        typeArguments: [`${PM_CONFIG.PM_PACKAGE}::pm::PM`],
        arguments: [
            tx.object(PM_CONFIG.ENCLAVE_CONFIG_ID),
            tx.pure.vector('u8', hexToBytes(TEE_PK_HEX)),
        ],
    });

    console.log('Registering Enclave (Debug Mode)...');
    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });

    console.log('Transaction digest:', result.digest);
    const confirmed = await client.waitForTransaction({ digest: result.digest });

    // Find created object
    const changes = confirmed.objectChanges?.filter(c => c.type === 'created')[0];
    if (changes && 'objectId' in changes) {
        console.log('✅ Enclave Registered! ID:', changes.objectId);
        console.log('Please update lib/pm.ts with ENCLAVE_OBJECT_ID:', changes.objectId);
    } else {
        console.log('Warning: Could not find created object in transaction logs');
        console.log(JSON.stringify(confirmed, null, 2));
    }
}

main().catch(console.error);
