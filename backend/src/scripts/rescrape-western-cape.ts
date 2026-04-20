import { getLatestConditions } from "../services/surfConditionsService";
import { prisma } from "../lib/prisma";

async function run() {
  const regionId = "western-cape";
  const sources = ["WINDFINDER", "WINDGURU"] as const;
  
  console.log(`\n🚀 Starting tactical rescrape for ${regionId}...`);
  console.log(`📅 Target Window: Today, Tomorrow, and Following Day`);
  
  for (const source of sources) {
    try {
      console.log(`\n📡 Rescraping Source: ${source}...`);
      
      // Force refresh will trigger a fresh scrape and update existing records
      const result = await getLatestConditions(regionId, true, source);
      
      if (result) {
        console.log(`✅ ${source} rescrape successful for ${regionId}.`);
      } else {
        console.log(`⚠️ ${source} returned no result but may have updated future dates.`);
      }
    } catch (error) {
      console.error(`❌ ${source} rescrape failed for ${regionId}:`, error);
    }
  }
  
  // Also calculate scores to be safe
  console.log(`\n📊 Rescrape mission complete sequence...`);
  
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error in rescrape:", err);
  process.exit(1);
});
