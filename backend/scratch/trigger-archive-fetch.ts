import { getLatestConditions } from "../src/services/surfConditionsService";
import { prisma } from "../src/lib/prisma";

async function main() {
  const regionId = "western-cape";
  const date = new Date("2026-05-28");
  const timeSlot = "NOON";

  console.log(`Triggering archive fetch via getLatestConditions for ${regionId} on ${date.toISOString().split('T')[0]} slot ${timeSlot}...`);

  const result = await getLatestConditions(
    regionId,
    true, // forceRefresh
    "OPENMETEO_ARCHIVE",
    undefined,
    date,
    timeSlot
  );

  console.log("Returned Forecast:", JSON.stringify(result, null, 2));

  // Verify that it is stored in the database
  const dbRecord = await prisma.forecast.findFirst({
    where: {
      date: date,
      regionId: regionId,
      source: "OPENMETEO_ARCHIVE",
      timeSlot: timeSlot
    }
  });

  console.log("Database Record:", JSON.stringify(dbRecord, null, 2));
}

main().finally(() => prisma.$disconnect());
