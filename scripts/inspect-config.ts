
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { bcs } from '@mysten/sui/bcs';

const ENCLAVE_CONFIG_ID = '0x15a2d73dbecf428e2856ff88db6648bb7bb6716129b2c8347c9ff50e6b4163e5';

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    console.log(`Fetching EnclaveConfig ${ENCLAVE_CONFIG_ID}...`);

    const obj = await client.getObject({
        id: ENCLAVE_CONFIG_ID,
        options: { showContent: true }
    });

    if (obj.data?.content?.dataType === 'moveObject') {
        const fields = obj.data.content.fields as any;
        console.log('EnclaveConfig Fields:', JSON.stringify(fields, null, 2));

        // Check PCRs
        // Struct Pcrs(vector<u8>, ...) in Move often appears as fields or array?
        // In moveObject, tuple struct fields might be named 'dummy' or similar or 'pcrs'?
        // The struct is `Pcrs(vector<u8>, vector<u8>, vector<u8>)`.
        // Usually represented as `fields: { contents: [...] }` or similar for tuple structs.

        console.log('PCRs:', fields.pcrs);
    } else {
        console.log('Object not found or not a Move object');
    }
}

main().catch(console.error);
