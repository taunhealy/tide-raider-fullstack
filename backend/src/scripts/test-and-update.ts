import { getLatestConditions } from "../services/surfConditionsService";
import * as dotenv from "dotenv";
import path from "path";

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  const regionId = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "western-cape"; 
  console.log(`--- Real-World Test: Semantic Scrape & DB Update for ${regionId} ---`);
  
  try {
    // getLatestConditions(regionId, forceRefresh, source, daysLimit)
    // We force refresh and set 10 days to get the upcoming week+
    const result = await getLatestConditions(regionId, true, "WINDFINDER_SUPER", 10);
    
    if (result) {
      console.log("✅ Success! Database updated with fresh data.");
      console.log("Swell Direction Extracted:", result.swellDirection);
      console.log("Wind Direction Extracted:", result.windDirection);
      console.log("Full Forecast Object:", JSON.stringify(result, null, 2));
    } else {
      console.error("❌ Failed: Scraper returned null result.");
    }
  } catch (error) {
    console.error("❌ Execution failed:", error);
  }
}

main();
