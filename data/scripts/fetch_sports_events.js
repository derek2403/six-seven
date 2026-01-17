const fs = require('fs');
const path = require('path');

const URL = 'https://gamma-api.polymarket.com/events?tag_id=1&order=id&ascending=false&closed=false&limit=300';
const OUTPUT_PATH = path.join(__dirname, '..', 'metadata', 'sports.json');

async function fetchEvents() {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        const counts = {};
        const filteredEvents = events.filter(event => {
            // Exclusions
            if (event.title.includes("Counter-Strike:") ||
                event.title.includes("Rainbow Six Siege:") ||
                event.title.includes("Mobile Legends Bang Bang:") ||
                event.title.includes("Dota 2:") ||
                event.title.includes("Rocket League: Ninjas in Pyjamas vs GameWard") ||
                event.title.includes("Rocket League: Gentle Mates Alpine vs WIP esports") ||
                event.title.includes("Valorant: Eintracht Frankfurt vs ALTERNATE aTTaX") ||
                event.title.includes("DEL: Adler Mannheim vs. Grizzlys Wolfsburg") ||
                event.title.includes("KHL: SKA St. Petersburg vs. Spartak Moscow") ||
                event.title.includes("KHL: CSKA Moscow vs. Barys Astana") ||
                event.title.includes("AHL: Laval Rocket vs. Abbotsford Canucks") ||
                event.title.includes("KHL: Torpedo vs. Shanghai Dragons") ||
                event.title.includes("AHL: San Diego Gulls vs. Tucson Roadrunners") ||
                event.title.includes("LoL: Invictus Gaming vs Top Esports") ||
                event.title.includes("LoL: LNG Esports vs LGD Gaming") ||
                event.title.includes("AHL: Colorado Eagles vs. Bakersfield Condors") ||
                event.title.includes("SHL: Froelunda HC vs. Skellefteaa") ||
                event.title.includes("AHL: Chicago Wolves vs. Cleveland Monsters")) {
                return false;
            }

            // Limit per category (prefix before colon)
            const category = event.title.includes(':') ? event.title.split(':')[0].trim() : 'Other';
            counts[category] = (counts[category] || 0) + 1;

            if (counts[category] > 5) {
                return false;
            }

            return true;
        });

        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filteredEvents, null, 2));
        console.log(`Saved ${filteredEvents.length} events to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

fetchEvents();
