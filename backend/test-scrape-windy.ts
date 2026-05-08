import { getLatestConditions } from "./src/services/surfConditionsService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const regionId = "western-cape";
  console.log(`🚀 Starting end-to-end Windy test scrape for ${regionId}...`);
  
  // 1. Run the scrape
  const result = await getLatestConditions(
    regionId,
    true, // forceRefresh
    "WINDY",
    1 // Just 1 day
  );

  if (!result) {
    console.error("❌ Scrape returned no result.");
    return;
  }

  console.log("✅ Scrape completed. Verifying database record...");

  // 2. Fetch the specific record from DB to verify storage
  const saved = await prisma.forecast.findFirst({
    where: {
      id: result.id
    }
  });

  if (!saved) {
    console.error("❌ Failed to find saved record in database.");
    return;
  }

  console.log("\n📊 TACTICAL DATA VERIFICATION:");
  console.log(`Source: ${saved.source}`);
  console.log(`Date: ${saved.date.toISOString().split('T')[0]}, Slot: ${saved.timeSlot}`);
  
  console.log("\n[SWELL 1]");
  console.log(`  Height: ${saved.swellHeight}m`);
  console.log(`  Period: ${saved.swellPeriod}s`);
  console.log(`  Direction: ${saved.swellDirection}°`);
  
  console.log("\n[SWELL 2]");
  console.log(`  Height: ${saved.swellHeight2}m`);
  console.log(`  Period: ${saved.swellPeriod2}s`);
  console.log(`  Direction: ${saved.swellDirection2}°`);
  
  console.log("\n[SWELL 3]");
  console.log(`  Height: ${saved.swellHeight3}m`);
  console.log(`  Period: ${saved.swellPeriod3}s`);
  console.log(`  Direction: ${saved.swellDirection3}°`);

  const hasMultiSwell = (saved.swellHeight2 || 0) > 0 || (saved.swellHeight3 || 0) > 0;
  console.log(`\nStatus: ${hasMultiSwell ? "✅ MULTI-SWELL DETECTED" : "⚠️ SINGLE SWELL ONLY (Expected if sea state is simple)"}`);
  
  const hasDirections = saved.swellDirection > 0 || saved.swellDirection2 > 0;
  console.log(`Directions: ${hasDirections ? "✅ CAPTURED" : "❌ MISSING (0°)"}`);
}

main()
  .catch(e => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
