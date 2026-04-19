import { scraperA } from "../src/lib/scrapers/scraperA";

async function run() {
  console.log("Starting test scrape...");
  const results = await (scraperA as any)("https://www.windfinder.com/forecast/muizenberg", "western-cape", {
    useSystemChrome: true
  });
  console.log("Results count:", results.length);
  results.forEach(f => {
    console.log(`${f.date.toISOString().split('T')[0]} - ${f.timeSlot}`);
  });
}

run().catch(error => {
  console.error("Scrape failed:", error);
  process.exit(1);
});
