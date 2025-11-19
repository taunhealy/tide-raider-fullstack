/**
 * Script to delete WINDY forecast data for today (or specific date/region)
 * Usage: npx tsx scripts/delete-windy-forecasts.ts [regionId] [date]
 *
 * Examples:
 *   npx tsx scripts/delete-windy-forecasts.ts                    # Delete all today's WINDY forecasts
 *   npx tsx scripts/delete-windy-forecasts.ts bali               # Delete today's WINDY forecasts for bali
 *   npx tsx scripts/delete-windy-forecasts.ts bali 2025-11-19    # Delete WINDY forecasts for bali on specific date
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteWindyForecasts(regionId?: string, date?: string) {
  try {
    // Build where clause
    const whereClause: any = {
      source: "WINDY",
    };

    if (date) {
      // Parse the date string (YYYY-MM-DD format)
      const [year, month, day] = date.split("-").map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      whereClause.date = targetDate;
      console.log(
        `🗑️  Deleting WINDY forecasts for date: ${targetDate.toISOString().split("T")[0]}`
      );
    } else {
      console.log(`🗑️  Deleting ALL WINDY forecasts`);
    }

    if (regionId) {
      whereClause.regionId = regionId;
      console.log(`   Region: ${regionId}`);
    } else {
      console.log(`   All regions`);
    }

    // Delete WINDY forecasts
    const deletedForecasts = await prisma.forecast.deleteMany({
      where: whereClause,
    });

    console.log(
      `✅ Deleted ${deletedForecasts.count} WINDY forecast record(s)`
    );

    // Also delete related beach scores (they'll be recalculated when forecasts are re-scraped)
    // Only delete scores if we're deleting forecasts for a specific date
    let deletedScores = { count: 0 };
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      deletedScores = await prisma.beachDailyScore.deleteMany({
        where: {
          date: targetDate,
          ...(regionId ? { regionId } : {}),
        },
      });
    }

    console.log(
      `✅ Deleted ${deletedScores.count} beach score record(s) (will be recalculated)`
    );

    console.log(`\n✨ Done! Re-scrape WINDY to get corrected directions.`);
  } catch (error) {
    console.error("❌ Error deleting WINDY forecasts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const regionId = process.argv[2];
const date = process.argv[3];

deleteWindyForecasts(regionId, date)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
