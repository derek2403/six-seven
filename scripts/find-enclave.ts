import { SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: 'https://rpc-testnet.suiscan.xyz:443' });

async function main() {
    const tx = await client.getTransactionBlock({
        digest: '8foqXJit6RD8xJ2NprbA6orzYHFAsD7GwpoK6RP4HBk4',
        options: { showObjectChanges: true }
    });

    const created = tx.objectChanges?.filter((c: any) => c.type === 'created');
    console.log('Created objects:');
    created?.forEach((obj: any) => {
        console.log(`  Type: ${obj.objectType}`);
        console.log(`  ID: ${obj.objectId}`);
        console.log('');
    });
}

main().catch(console.error);
