const fs = require('fs');
const path = require('path');
//curl "https://gamma-api.polymarket.com/events?tag_id=78&order=id&ascending=false&closed=false&limit=100"
const URL = 'https://gamma-api.polymarket.com/events?tag_id=78&order=id&ascending=false&closed=false&limit=100';
const OUTPUT_PATH = path.join(__dirname, '..', 'metadata', 'politics_events.json');

async function fetchEvents() {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        const filteredEvents = events.filter(event =>
            !event.title.includes("US strikes Iran or Trump announces Fed nominee first?")
        );

        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filteredEvents, null, 2));
        console.log(`Saved ${filteredEvents.length} events to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

fetchEvents();
