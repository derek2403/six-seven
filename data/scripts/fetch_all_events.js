const fs = require('fs');
const path = require('path');

const URL = 'https://gamma-api.polymarket.com/events';
const OUTPUT_PATH = path.join(__dirname, '..', 'metadata', 'all_events.json');

async function fetchEvents() {
    const response = await fetch(URL);
    const events = await response.json();

    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(events, null, 2));
    console.log(`Saved ${events.length} events to ${OUTPUT_PATH}`);
}

fetchEvents();
