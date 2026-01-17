module listing::listing {
    use std::string::{Self, String};
    use std::vector;

    // ======== Error Codes ========
    const EInvalidSubmarketCount: u64 = 0;

    // ======== Structs ========

    /// Represents a submarket within a listing
    public struct Submarket has store, drop {
        title: String,
        image_url: String,
    }

    /// Main Listing object
    public struct Listing has key, store {
        id: UID,
        title: String,
        image_url: String,
        submarkets: vector<Submarket>,
    }

    // ======== Entry Functions ========

    /// Create a new listing with exactly 3 submarkets
    public entry fun create_listing(
        title: vector<u8>,
        image_url: vector<u8>,
        submarket_titles: vector<vector<u8>>,
        submarket_images: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        // Validate input lengths
        let submarket_count = vector::length(&submarket_titles);
        assert!(submarket_count == 3, EInvalidSubmarketCount);
        assert!(vector::length(&submarket_images) == 3, EInvalidSubmarketCount);

        let mut submarkets = vector::empty<Submarket>();
        let mut i = 0;
        while (i < 3) {
            let sub_title = *vector::borrow(&submarket_titles, i);
            let sub_image = *vector::borrow(&submarket_images, i);
            
            let submarket = Submarket {
                title: string::utf8(sub_title),
                image_url: string::utf8(sub_image),
            };
            vector::push_back(&mut submarkets, submarket);
            i = i + 1;
        };

        let listing = Listing {
            id: object::new(ctx),
            title: string::utf8(title),
            image_url: string::utf8(image_url),
            submarkets,
        };

        transfer::share_object(listing);
    }

    // ======== View Functions ========

    public fun get_title(listing: &Listing): String {
        listing.title
    }

    public fun get_image_url(listing: &Listing): String {
        listing.image_url
    }

    public fun get_submarkets(listing: &Listing): &vector<Submarket> {
        &listing.submarkets
    }
}
