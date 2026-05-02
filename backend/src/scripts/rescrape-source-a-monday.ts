import { getLatestConditions } from "../services/surfConditionsService";
import { prisma } from "../lib/prisma";

async function run() {
  const regionId = "western-cape";
  const source = "WINDFINDER";
  
  // Set target date to Monday, May 4, 2026
  const targetDate = new Date("2026-05-04T00:00:00Z");
  
  console.log(`\n🚀 Starting TARGETED rescrape for ${regionId}...`);
  console.log(`📅 Target Date: Monday, ${targetDate.toISOString().split('T')[0]}`);
  console.log(`📡 Source: ${source}`);
  
  try {
    // Force refresh will trigger a fresh scrape and update existing records
    // getLatestConditions will scrape the full window (usually 3 or 10 days depending on the URL)
    // and upsert all of them.
    const result = await getLatestConditions(
      regionId, 
      true, // forceRefresh
      source, 
      undefined, // daysLimit
      targetDate
    );
    
    if (result) {
      console.log(`✅ ${source} rescrape successful for ${regionId}. Result for target date:`, result.date, result.timeSlot);
    } else {
      console.log(`⚠️ ${source} returned no result for the specific target date, but check the logs for other days.`);
    }
  } catch (error) {
    console.error(`❌ ${source} rescrape failed for ${regionId}:`, error);
  }
  
  console.log(`\n📊 Rescrape mission complete.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error in rescrape:", err);
  process.exit(1);
});
