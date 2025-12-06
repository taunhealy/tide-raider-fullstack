/**
 * Script to delete WINDFINDER (Source A) forecast data for today and future dates
 * This forces the scraper to re-fetch fresh data
 * 
 * Usage: npx tsx scripts/delete-windfinder-forecasts.ts [regionId]
 * 
 * Examples:
 *   npx tsx scripts/delete-windfinder-forecasts.ts                    # Delete all WINDFINDER forecasts from today onwards
 *   npx tsx scripts/delete-windfinder-forecasts.ts western-cape      # Delete WINDFINDER forecasts for western-cape from today onwards
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteWindfinderForecasts(regionId?: string) {
  try {
    // Get today's date (UTC, midnight)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log(`🗑️  Deleting WINDFINDER (Source A) forecasts from today onwards`);
    console.log(`   Date: ${today.toISOString().split("T")[0]} and future dates`);
    if (regionId) {
      console.log(`   Region: ${regionId}`);
    } else {
      console.log(`   All regions`);
    }

    // Build where clause for Forecast table
    const forecastWhereClause: any = {
      source: "WINDFINDER",
      date: {
        gte: today, // Greater than or equal to today
      },
    };

    if (regionId) {
      forecastWhereClause.regionId = regionId;
    }

    // Delete WINDFINDER forecasts from today onwards
    const deletedForecasts = await prisma.forecast.deleteMany({
      where: forecastWhereClause,
    });

    console.log(
      `✅ Deleted ${deletedForecasts.count} WINDFINDER forecast record(s)`
    );

    // Build where clause for BeachDailyScore table
    const scoreWhereClause: any = {
      source: "WINDFINDER",
      date: {
        gte: today, // Greater than or equal to today
      },
    };

    if (regionId) {
      scoreWhereClause.regionId = regionId;
    }

    // Also delete related beach scores (they'll be recalculated when forecasts are re-scraped)
    const deletedScores = await prisma.beachDailyScore.deleteMany({
      where: scoreWhereClause,
    });

    console.log(
      `✅ Deleted ${deletedScores.count} beach score record(s) (will be recalculated when re-scraped)`
    );

    console.log(`\n✨ Done! The scraper will now fetch fresh WINDFINDER data when requested.`);
  } catch (error) {
    console.error("❌ Error deleting WINDFINDER forecasts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const regionId = process.argv[2];

deleteWindfinderForecasts(regionId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


