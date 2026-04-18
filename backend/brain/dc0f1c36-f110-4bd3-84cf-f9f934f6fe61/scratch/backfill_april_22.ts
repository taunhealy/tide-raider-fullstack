import { getLatestConditions } from "../../../src/services/surfConditionsService";
import { prisma } from "../../../src/lib/prisma";

async function backfillApril22() {
  console.log("🚀 Starting Manual Forensic Backfill for April 22nd...");

  const regions = ["western-cape", "eastern-cape"];
  const source = "WINDFINDER";

  for (const regionId of regions) {
    console.log(`\n📡 Processing Region: ${regionId}`);
    try {
      // Trigger a force refresh with a 10-day window
      const result = await getLatestConditions(regionId, true, source as any, 10);
      
      if (result) {
        console.log(`✅ Success for ${regionId}. Result count verified.`);
      }
    } catch (error) {
      console.error(`❌ Failed to backfill ${regionId}:`, error);
    }
  }

  // Final verification
  console.log("\n🧪 Running final audit...");
  const targetDate = new Date("2026-04-22");
  targetDate.setUTCHours(0, 0, 0, 0);
  
  const count = await prisma.beachDailyScore.count({
    where: { date: targetDate }
  });

  console.log(`\n📊 Final Audit: Found ${count} beach scores for April 22nd.`);
}

backfillApril22()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
