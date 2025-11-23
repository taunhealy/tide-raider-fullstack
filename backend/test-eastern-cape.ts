
import { getLatestConditions } from "./src/services/surfConditionsService";
import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Testing forecast fetch for Eastern Cape...");

  try {
    // Try with the canonical ID
    console.log("\n--- Attempt 1: 'eastern-cape' ---");
    // forceRefresh = true to ensure we try to scrape
    const result1 = await getLatestConditions("eastern-cape", true); 
    console.log("Result 1:", result1 ? "✅ Found data" : "❌ No data");
    if (result1) {
        console.log(`Date: ${result1.date}`);
        console.log(`Source: ${result1.source}`);
        console.log(`Wind: ${result1.windSpeed} kts @ ${result1.windDirection}°`);
        console.log(`Swell: ${result1.swellHeight}m @ ${result1.swellPeriod}s ${result1.swellDirection}°`);
    }

    // Try with the Capitalized ID (to test robustness)
    console.log("\n--- Attempt 2: 'Eastern Cape' ---");
    const result2 = await getLatestConditions("Eastern Cape", true);
    console.log("Result 2:", result2 ? "✅ Found data" : "❌ No data");
    if (result2) {
        console.log(`Date: ${result2.date}`);
        console.log(`Source: ${result2.source}`);
    }

  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
