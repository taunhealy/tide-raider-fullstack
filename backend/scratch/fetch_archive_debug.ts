import { prisma } from "../src/lib/prisma";
import { getLatestConditions } from "../src/services/surfConditionsService";

async function main() {
  const regionId = "eastern-cape";
  const date = new Date("2026-04-29T00:00:00.000Z");
  
  console.log(`Triggering archive fetch for ${regionId} on ${date.toISOString()}`);
  
  try {
    const result = await getLatestConditions(
      regionId,
      true, // forceRefresh
      "OPENMETEO_ARCHIVE",
      1,
      date,
      "MORNING"
    );
    
    console.log("Archive fetch result:", JSON.stringify(result, null, 2));
    
    // Also fetch for other slots to be sure
    await getLatestConditions(regionId, true, "OPENMETEO_ARCHIVE", 1, date, "NOON");
    await getLatestConditions(regionId, true, "OPENMETEO_ARCHIVE", 1, date, "EVENING");
    
    console.log("Archive fetch completed for all slots.");
  } catch (error) {
    console.error("Archive fetch failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
