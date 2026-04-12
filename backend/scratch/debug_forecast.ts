
import { scraperA } from "../src/lib/scrapers/scraperA";
import { PythonBridge } from "../src/lib/pythonBridge";

async function test() {
  const url = "https://www.windfinder.com/forecast/muizenberg"; // Regular forecast
  const regionId = "western-cape";
  
  console.log("=== Testing ScraperA ===");
  try {
    const results = await scraperA(url, regionId);
    console.log("Results from ScraperA:", JSON.stringify(results.filter(f => f.date.getUTCDate() === 15), null, 2));
  } catch (e) {
    console.error("ScraperA failed:", e);
  }
  
  console.log("\n=== Testing Semantic Fallback ===");
  try {
    const semanticResults = await PythonBridge.runSemanticScrape(url, regionId);
    console.log("Results from Semantic Scrape:", JSON.stringify(semanticResults.filter(f => f.date.getUTCDate() === 15), null, 2));
  } catch (e) {
    console.error("Semantic fallback failed:", e);
  }
}

test();
