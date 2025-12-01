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

    // Schedule: Run twice per day at 02:00 UTC (4am SA time) and 20:00 UTC (4am Bali time)
    const task = cron.schedule(
      "0 2,20 * * *",
      async () => {
        await this.runScheduledJob();
      },
      {
        timezone: "UTC",
      }
    );

    this.tasks.push(task);
    console.log(
      "✅ Cron job scheduled: Twice daily at 02:00 UTC (4am SA) and 20:00 UTC (4am Bali)"
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
      // Step 1: Fetch and store surf conditions for all regions
      console.log("📊 Step 1: Fetching surf conditions for all regions");
      let regionResults;
      try {
        regionResults = await fetchAllRegionsData();
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
}

// Singleton instance
let schedulerInstance: CronScheduler | null = null;

export function getCronScheduler(): CronScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new CronScheduler();
  }
  return schedulerInstance;
}
