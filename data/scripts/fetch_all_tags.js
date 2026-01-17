const fs = require('fs');
const path = require('path');

const URL = 'https://gamma-api.polymarket.com/tags?limit=1000';
const OUTPUT_PATH = path.join(__dirname, '..', 'metadata', 'all_tags.json');

async function fetchTags() {
    console.log('Fetching all tags from Polymarket...');
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tags = await response.json();

        // Ensure the metadata directory exists
        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const metadata = {
            fetchedAt: new Date().toISOString(),
            totalTags: tags.length,
            tags: tags
        };

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(metadata, null, 2));
        console.log(`Successfully saved ${tags.length} tags to ${OUTPUT_PATH}`);

        // Also print a summary of the first few tags
        console.log('\nTop Tags Summary:');
        tags.slice(0, 20).forEach(tag => {
            console.log(`ID: ${tag.id.padEnd(8)} | Slug: ${tag.slug.padEnd(25)} | Label: ${tag.label}`);
        });
    } catch (error) {
        console.error('Error fetching tags:', error);
    }
}

fetchTags();
