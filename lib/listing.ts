import { Transaction } from '@mysten/sui/transactions';
import { LISTING_CONFIG } from './config';

export interface SubmarketInput {
    title: string;
    image: string;
}

export interface CreateListingArgs {
    title: string;
    description: string;
    imageUrl: string;
    submarkets: SubmarketInput[];
}

/**
 * Build a transaction to create a new listing
 * @param args Listing details
 * @returns Transaction object ready to be signed and executed
 */
export const createListingTx = (args: CreateListingArgs): Transaction => {
    const tx = new Transaction();

    const submarketTitles = args.submarkets.map(s => s.title);
    const submarketImages = args.submarkets.map(s => s.image);

    tx.moveCall({
        target: `${LISTING_CONFIG.PACKAGE_ID}::${LISTING_CONFIG.MODULE_NAME}::create_listing`,
        arguments: [
            tx.pure.string(args.title),
            tx.pure.string(args.description),
            tx.pure.string(args.imageUrl),
            tx.pure.vector('string', submarketTitles),
            tx.pure.vector('string', submarketImages),
        ],
    });

    return tx;
};
