/**
 * Script to force scrape forecast data for a specific region
 * Usage: npx tsx scripts/force-scrape.ts <regionId>
 * 
 * Example:
 *   npx tsx scripts/force-scrape.ts western-cape
 */

// Note: This script should be run from the backend directory
// Make sure to set up the environment variables first
import { getLatestConditions } from "../src/services/surfConditionsService";

async function forceScrape(regionId: string) {
  try {
    console.log(`🌐 Force scraping forecast for region: ${regionId}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

    // Force refresh = true will scrape even if data exists
    const forecast = await getLatestConditions(regionId, true);

    if (forecast) {
      console.log(`\n✅ Successfully scraped forecast:`);
      console.log(`   Date: ${forecast.date.toISOString().split("T")[0]}`);
      console.log(`   Wind Speed: ${forecast.windSpeed} kts`);
      console.log(`   Wind Direction: ${forecast.windDirection}°`);
      console.log(`   Swell Height: ${forecast.swellHeight}m`);
      console.log(`   Swell Period: ${forecast.swellPeriod}s`);
      console.log(`   Swell Direction: ${forecast.swellDirection}°`);
    } else {
      console.log(`\n⚠️  No forecast data returned`);
    }
  } catch (error) {
    console.error("❌ Error scraping forecast:", error);
    throw error;
  }
}

// Get command line arguments
const regionId = process.argv[2];

if (!regionId) {
  console.error("❌ Error: Region ID is required");
  console.log("\nUsage: npx tsx scripts/force-scrape.ts <regionId>");
  console.log("\nExample:");
  console.log("  npx tsx scripts/force-scrape.ts western-cape");
  process.exit(1);
}

forceScrape(regionId)
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

