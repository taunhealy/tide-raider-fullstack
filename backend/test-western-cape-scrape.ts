import { scraperB } from "./src/lib/scrapers/scraperB";

async function test() {
  console.log("Testing western-cape Windguru scrape");
  console.log("Current time:", new Date().toISOString());
  
  try {
    const forecasts = await scraperB(
      "https://www.windguru.cz/95115",
      "western-cape"
    );
    
    console.log(`\n✅ Scraper returned ${forecasts.length} forecast(s):`);
    forecasts.forEach(f => {
      console.log(`  Date: ${f.date}, Wind: ${f.windSpeed}m/s, Swell: ${f.swellHeight}m`);
    });
  } catch (error) {
    console.error("\n❌ Scraper failed:", error);
  }
  
  process.exit(0);
}

test();