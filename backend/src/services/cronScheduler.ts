import * as cron from "node-cron";
import { fetchAllRegionsData } from "./regionDataService";
import { processAllUserAlerts } from "./alertProcessor";

/**
 * Cron Scheduler Service
 * Runs scheduled tasks to fetch region data and process alerts
 *
 * Schedule:
 * - Every 4 hours: Fetch region data and process alerts
 * - This ensures global coverage (6 times per day)
 *
 * Times (UTC):
 * - 00:00 (midnight UTC) - Asia/Pacific morning
 * - 04:00 (4 AM UTC) - Europe/Africa morning
 * - 08:00 (8 AM UTC) - Europe/Africa midday, Americas early morning
 * - 12:00 (noon UTC) - Americas morning, Europe/Africa afternoon
 * - 16:00 (4 PM UTC) - Americas afternoon, Asia/Pacific evening
 * - 20:00 (8 PM UTC) - Americas evening, Asia/Pacific night
 */
export class CronScheduler {
  private tasks: cron.ScheduledTask[] = [];

  /**
   * Start all scheduled cron jobs
   */
  start() {
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.ENABLE_CRON_IN_DEV
    ) {
      console.log(
        "⏸️  Cron jobs disabled in development (set ENABLE_CRON_IN_DEV=true to enable)"
      );
      return;
    }

    console.log("🕐 Starting cron scheduler...");

    // Schedule: Run once daily at 01:00 UTC (3am SA time)
    const task = cron.schedule(
      "0 1 * * *",
      async () => {
        await this.runScheduledJob();
      },
      {
        timezone: "UTC",
      }
    );

    this.tasks.push(task);
    console.log(
      "✅ Cron job scheduled: Once daily at 01:00 UTC (3am SAST)"
    );

    // Optional: Run immediately on startup (useful for testing)
    if (process.env.RUN_CRON_ON_STARTUP === "true") {
      console.log("🚀 Running cron job immediately on startup...");
      // Run after a short delay to ensure server is fully initialized
      setTimeout(() => {
        this.runScheduledJob().catch((error) => {
          console.error("❌ Error running startup cron job:", error);
        });
      }, 5000); // 5 second delay
    }
  }

  /**
   * Stop all scheduled cron jobs
   */
  stop() {
    console.log("🛑 Stopping cron scheduler...");
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
    console.log("✅ All cron jobs stopped");
  }

  /**
   * Run the scheduled job (fetch regions + process alerts)
   */
  private async runScheduledJob() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`\n🕐 [${timestamp}] Starting scheduled cron job...`);

    try {
      // Step 0: Clean up stale/future database records
      console.log("🧹 Step 0: Cleaning up stale/future forecast records");
      try {
        const { prisma } = require("../lib/prisma");
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        // Remove anything older than 2 days
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - 2);
        
        // Remove anything further than 10 days in the future
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 10);

        const deletedStale = await prisma.forecast.deleteMany({
          where: {
            OR: [
              { date: { lt: pastDate } },
              { date: { gt: futureDate } }
            ]
          }
        });
        console.log(`✅ Cleanup complete: Removed ${deletedStale.count} invalid/stale forecast records`);
      } catch (cleanupError) {
        console.error("❌ Cleanup failed:", cleanupError);
      }

      // Step 1: Fetch and store surf conditions for all regions
      console.log("📊 Step 1: Fetching surf conditions for all regions");
      let regionResults;
      try {
        // Daily run: Fetch 7 days of data (users requested more than 2 days)
        regionResults = await fetchAllRegionsData(7);
        console.log("✅ Region data fetch completed:", {
          regionsProcessed: regionResults.regionsProcessed,
          regionsSucceeded: regionResults.regionsSucceeded,
          regionsFailed: regionResults.regionsFailed,
        });
      } catch (error) {
        console.error("❌ Failed to fetch region data:", error);
        // Continue to alerts even if region fetch fails
        regionResults = {
          regionsProcessed: 0,
          regionsSucceeded: 0,
          regionsFailed: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        };
      }

      // Step 2: Process alerts for all users
      console.log("🔔 Step 2: Processing alerts for all users");
      let alertResults;
      try {
        alertResults = await processAllUserAlerts();
        console.log("✅ Alert processing completed:", {
          usersProcessed: alertResults.usersProcessed,
          alertsChecked: alertResults.alertsChecked,
          notificationsSent: alertResults.notificationsSent,
          errors: alertResults.errors,
        });
      } catch (error) {
        console.error("❌ Failed to process alerts:", error);
        alertResults = {
          usersProcessed: 0,
          alertsChecked: 0,
          notificationsSent: 0,
          errors: 1,
          errorDetails: [
            error instanceof Error ? error.message : "Unknown error",
          ],
        };
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ [${new Date().toISOString()}] Cron job completed in ${duration}ms`
      );
      console.log("📊 Summary:", {
        regionResults,
        alertResults,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        regionResults,
        alertResults,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [${new Date().toISOString()}] Cron job failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  }

  /**
   * Manually trigger the cron job (for testing)
   */
  async runNow() {
    console.log("🔧 Manually triggering cron job...");
    return await this.runScheduledJob();
  }

  /**
   * Run the weekly full scrape (fetches all available days)
   * This is resource intensive!
   */
  async runWeeklyJob() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`\n📅 [${timestamp}] Starting WEEKLY scraping job...`);

    try {
      // Step 1: Fetch and store surf conditions for all regions (FULL SCRAPE)
      console.log("📊 Fetching FULL WEEK surf conditions for all regions");
      const regionResults = await fetchAllRegionsData(); // No limit = full week
      
      const duration = Date.now() - startTime;
      console.log(
        `✅ [${new Date().toISOString()}] Weekly scrape completed in ${duration}ms`
      );
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        regionResults,
        type: "WEEKLY_FULL_SCRAPE"
      };
    } catch (error) {
       const duration = Date.now() - startTime;
       console.error(`❌ Weekly scrape failed after ${duration}ms:`, error);
       throw error;
    }
  }
}

// Singleton instance
let schedulerInstance: CronScheduler | null = null;

export function getCronScheduler(): CronScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new CronScheduler();
  }
  return schedulerInstance;
}
