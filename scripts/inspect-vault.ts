import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { VAULT_CONFIG } from '../lib/config';

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    console.log(`Inspecting ${VAULT_CONFIG.PACKAGE_ID}::${VAULT_CONFIG.MODULE_NAME}::deposit`);

    try {
        const args = await client.getMoveFunctionArgTypes({
            package: VAULT_CONFIG.PACKAGE_ID,
            module: VAULT_CONFIG.MODULE_NAME,
            function: 'set_withdrawable_balance',
        });

        console.log('Argument Types:', JSON.stringify(args, null, 2));

        // Also check if it takes type args
        const normalized = await client.getNormalizedMoveFunction({
            package: VAULT_CONFIG.PACKAGE_ID,
            module: VAULT_CONFIG.MODULE_NAME,
            function: 'set_withdrawable_balance',
        });
        console.log('Normalized Function:', JSON.stringify(normalized, null, 2));

    } catch (e) {
        console.error("Error inspecting function:", e);
    }
}

main();
