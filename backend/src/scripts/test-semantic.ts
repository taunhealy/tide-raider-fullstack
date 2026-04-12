import { PythonBridge } from "../lib/pythonBridge";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";
import * as dotenv from "dotenv";
import path from "path";

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  const regionId = "western-cape"; // Muizenberg
  const config = REGION_CONFIGS[regionId];
  
  if (!config) {
    console.error("Region config not found");
    return;
  }

  const url = config.sourceA.url;
  console.log(`Testing semantic scrape for ${regionId} at ${url}`);
  
  try {
    const results = await PythonBridge.runSemanticScrape(url, regionId);
    console.log("--- Results ---");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Scrape failed:", error);
  }
}

main();
