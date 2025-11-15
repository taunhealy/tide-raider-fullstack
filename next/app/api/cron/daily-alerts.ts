import { processUserAlerts } from "@/app/lib/services/alertProcessor";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getLatestConditions } from "@/app/api/surf-conditions/route";
import { ScoreService } from "@/app/services/scores/ScoreService";

// Increase timeout for processing multiple users and regions (5 minutes)
export const maxDuration = 300;

// This endpoint will be triggered by a cron job daily at 5am SAST (3am UTC)
// It fetches forecast data for all regions and processes user alerts
export async function GET() {
  try {
    console.log("🔄 Starting daily cron job: fetching forecasts and processing alerts");

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 1: Fetch forecast data for all regions
    console.log("📊 Step 1: Fetching forecast data for all regions");
    const regions = await prisma.region.findMany();
    console.log(`Found ${regions.length} regions to process`);

    const forecastResults = {
      regionsProcessed: 0,
      regionsSucceeded: 0,
      regionsFailed: 0,
    };

    // Process each region sequentially to avoid overwhelming the database
    for (const region of regions) {
      try {
        console.log(`Processing region: ${region.name} (${region.id})`);

        // Get latest conditions for the region (this will scrape if needed)
        const conditions = await getLatestConditions(true, region.id);

        if (!conditions) {
          console.log(
            `No conditions found for region ${region.id}, skipping...`
          );
          forecastResults.regionsFailed++;
          continue;
        }

        // Calculate and store scores for this region
        await ScoreService.calculateAndStoreScores(region.id, conditions);
        console.log(`Successfully processed region ${region.id}`);
        forecastResults.regionsSucceeded++;
      } catch (error) {
        console.error(`Error processing region ${region.id}:`, error);
        forecastResults.regionsFailed++;
        // Continue with next region even if one fails
        continue;
      } finally {
        forecastResults.regionsProcessed++;
      }
    }

    console.log("✅ Forecast data fetch completed", forecastResults);

    // Step 2: Process user alerts
    console.log("🔔 Step 2: Processing user alerts");

    // 1. Get all users with active alerts
    const usersWithAlerts = await prisma.user.findMany({
      where: {
        alerts: {
          some: {
            active: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`👥 Found ${usersWithAlerts.length} users with active alerts`);

    // 2. Process alerts for each user
    const results = {
      usersProcessed: 0,
      alertsChecked: 0,
      notificationsSent: 0,
      errors: 0,
    };

    for (const user of usersWithAlerts) {
      try {
        console.log(`👤 Processing alerts for user: ${user.id}`);

        // Process all alerts for this user
        const userResult = await processUserAlerts(user.id, today);

        // Update overall results
        results.usersProcessed++;
        results.alertsChecked += userResult.alertsChecked;
        results.notificationsSent += userResult.notificationsSent;
        results.errors += userResult.errors;
      } catch (error) {
        console.error(`❌ Error processing alerts for user ${user.id}:`, error);
        results.errors++;
      }
    }

    console.log("✅ Daily alert check completed", results);

    return NextResponse.json({
      success: true,
      message: "Daily cron job completed",
      forecastResults,
      alertResults: results,
    });
  } catch (error) {
    console.error("❌ Error in daily alert check:", error);
    return NextResponse.json(
      { error: "Failed to process daily alerts" },
      { status: 500 }
    );
  }
}
