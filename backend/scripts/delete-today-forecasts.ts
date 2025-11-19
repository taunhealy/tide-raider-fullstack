/**
 * Script to delete forecast data for today (all sources)
 * Usage: npx tsx scripts/delete-today-forecasts.ts [regionId]
 * 
 * Examples:
 *   npx tsx scripts/delete-today-forecasts.ts                    # Delete all today's forecasts
 *   npx tsx scripts/delete-today-forecasts.ts western-cape       # Delete today's forecasts for western-cape only
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteTodayForecasts(regionId?: string) {
  try {
    // Get today's date (UTC, midnight)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log(`🗑️  Deleting forecasts for date: ${today.toISOString().split("T")[0]}`);
    if (regionId) {
      console.log(`   Region: ${regionId}`);
    } else {
      console.log(`   All regions`);
    }

    // Build where clause
    const whereClause: any = {
      date: today,
    };

    if (regionId) {
      whereClause.regionId = regionId;
    }

    // Delete forecasts
    const deletedForecasts = await prisma.forecast.deleteMany({
      where: whereClause,
    });

    console.log(`✅ Deleted ${deletedForecasts.count} forecast record(s)`);

    // Also delete related beach scores for that date
    const deletedScores = await prisma.beachDailyScore.deleteMany({
      where: {
        date: today,
        ...(regionId ? { regionId } : {}),
      },
    });

    console.log(`✅ Deleted ${deletedScores.count} beach score record(s)`);

    console.log(`\n✨ Done! The scraper will now fetch fresh data when requested.`);
  } catch (error) {
    console.error("❌ Error deleting forecasts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const regionId = process.argv[2];

deleteTodayForecasts(regionId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

