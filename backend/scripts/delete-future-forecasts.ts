/**
 * Script to delete ALL forecast sources (WINDFINDER, WINDGURU, WINDY)
 * for today and future dates to force fresh scraping
 *
 * Usage: npx tsx scripts/delete-future-forecasts.ts [regionId]
 *
 * Examples:
 *   npx tsx scripts/delete-future-forecasts.ts                    # Delete all forecasts from today onwards (all sources, all regions)
 *   npx tsx scripts/delete-future-forecasts.ts western-cape      # Delete forecasts for western-cape from today onwards
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteFutureForecasts(regionId?: string) {
  try {
    // Get today's date (UTC, midnight)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log(`🗑️  Deleting ALL forecast sources from today onwards`);
    console.log(
      `   Date: ${today.toISOString().split("T")[0]} and future dates`
    );
    console.log(`   Sources: WINDFINDER, WINDGURU, WINDY`);
    if (regionId) {
      console.log(`   Region: ${regionId}`);
    } else {
      console.log(`   All regions`);
    }

    // Build where clause for Forecast table
    const forecastWhereClause: any = {
      date: {
        gte: today, // Greater than or equal to today
      },
    };

    if (regionId) {
      forecastWhereClause.regionId = regionId;
    }

    // Delete ALL forecasts from today onwards (all sources)
    const deletedForecasts = await prisma.forecast.deleteMany({
      where: forecastWhereClause,
    });

    console.log(
      `✅ Deleted ${deletedForecasts.count} forecast record(s) (all sources)`
    );

    // Build where clause for BeachDailyScore table
    const scoreWhereClause: any = {
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

    // Show summary by source
    console.log(`\n📊 Summary:`);
    console.log(`   - Forecasts deleted: ${deletedForecasts.count}`);
    console.log(`   - Beach scores deleted: ${deletedScores.count}`);
    console.log(
      `\n✨ Done! The scraper will now fetch fresh data for all sources when requested.`
    );
  } catch (error) {
    console.error("❌ Error deleting forecasts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const regionId = process.argv[2];

deleteFutureForecasts(regionId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
