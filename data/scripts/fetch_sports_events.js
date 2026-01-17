const fs = require('fs');
const path = require('path');

const URL = 'https://gamma-api.polymarket.com/events?tag_id=1&order=id&ascending=false&closed=false&limit=20';
const OUTPUT_PATH = path.join(__dirname, '..', 'metadata', 'sports.json');

async function fetchEvents() {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(events, null, 2));
        console.log(`Saved ${events.length} events to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

fetchEvents();
