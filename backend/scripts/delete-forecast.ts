/**
 * Script to delete forecast data for a specific region and date
 * Usage: npx tsx scripts/delete-forecast.ts <regionId> [date]
 * 
 * Examples:
 *   npx tsx scripts/delete-forecast.ts western-cape
 *   npx tsx scripts/delete-forecast.ts western-cape 2025-11-17
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteForecast(regionId: string, date?: string) {
  try {
    let targetDate: Date;
    
    if (date) {
      // Parse the date string (YYYY-MM-DD format)
      const [year, month, day] = date.split("-").map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      // Default to today
      targetDate = new Date();
      targetDate.setUTCHours(0, 0, 0, 0);
    }

    console.log(`🗑️  Deleting forecast for region: ${regionId}, date: ${targetDate.toISOString().split("T")[0]}`);

    // Delete forecast
    const deletedForecast = await prisma.forecastA.deleteMany({
      where: {
        regionId,
        date: targetDate,
      },
    });

    console.log(`✅ Deleted ${deletedForecast.count} forecast record(s)`);

    // Also delete related beach scores for that date
    const deletedScores = await prisma.beachDailyScore.deleteMany({
      where: {
        region: {
          id: regionId,
        },
        date: targetDate,
      },
    });

    console.log(`✅ Deleted ${deletedScores.count} beach score record(s)`);

    console.log(`\n✨ Done! The scraper will now fetch fresh data when requested.`);
  } catch (error) {
    console.error("❌ Error deleting forecast:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const regionId = process.argv[2];
const date = process.argv[3];

if (!regionId) {
  console.error("❌ Error: Region ID is required");
  console.log("\nUsage: npx tsx scripts/delete-forecast.ts <regionId> [date]");
  console.log("\nExamples:");
  console.log("  npx tsx scripts/delete-forecast.ts western-cape");
  console.log("  npx tsx scripts/delete-forecast.ts western-cape 2025-11-17");
  process.exit(1);
}

deleteForecast(regionId, date)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

