// Script to update EnclaveConfig PCRs to production values
// Run with: npx ts-node scripts/update-pcrs.ts

import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as fs from 'fs';
import * as path from 'path';

// Package and config IDs
// Package and config IDs - Synced with lib/pm.ts
const ENCLAVE_PACKAGE = '0x3a0c541676d4844f1296e92b28163ea079f45b77867599724f141322ff3e8a41';
const MARKET_PACKAGE = '0x327d01aa4fdc8cba53596b225510a6b5afc5d2266227654574fe6347a45d3973';
const ENCLAVE_CONFIG_ID = '0x15a2d73dbecf428e2856ff88db6648bb7bb6716129b2c8347c9ff50e6b4163e5';
const CAP_OBJECT_ID = '0x1f119c0a6c3e14d727e795c252d329b8f8468158d7bc723f757f70b04ca90132';

// Production PCRs from docker build - UPDATED to match current enclave
const PCR0 = '9f6b4858adc2cae5cf1a6b19ee2d0b4742e51e37003f4a1921af225c3f79994f07a9e9d5ca643f9c7314eac2b66abc6d';
const PCR1 = '9f6b4858adc2cae5cf1a6b19ee2d0b4742e51e37003f4a1921af225c3f79994f07a9e9d5ca643f9c7314eac2b66abc6d';
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
        typeArguments: [`${MARKET_PACKAGE}::pm::PM`],
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
