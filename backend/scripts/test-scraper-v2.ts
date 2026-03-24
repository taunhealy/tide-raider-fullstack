
import { scraperA } from "../src/lib/scrapers/scraperA";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const url = "https://www.windfinder.com/weatherforecast/muizenberg";
    try {
        console.log("Testing updated scraper...");
        const data = await scraperA(url, "western-cape");
        console.log("Scraped data:", JSON.stringify(data[0], null, 2));
        console.log(`Successfully scraped ${data.length} forecasts.`);
    } catch (e: any) {
        console.error("Scraper failed:", e.message);
    }
}

main();
