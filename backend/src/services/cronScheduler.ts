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

    // High frequency tactical sync for South Africa regions (Every 4 hours)
    // Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
    const saHighFreqTask = cron.schedule(
      "0 */4 * * *",
      async () => {
        console.log("🇿🇦 Running high-frequency tactical scrape for South Africa regions...");
        // Scrape today and tomorrow (3 days) for South Africa regions
        await fetchAllRegionsData(3, ["western-cape", "eastern-cape"]);
        await processAllUserAlerts();
      },
      {
        timezone: "UTC",
      }
    );
    this.tasks.push(saHighFreqTask);
    console.log(
      "✅ South Africa High-frequency tactical sync scheduled: Every 4 hours"
    );
 
    // Sunday Morning Newsletter (Run every Sunday at 07:00 UTC / 9:00 AM SAST)
    const newsletterTask = cron.schedule(
      "0 7 * * 0",
      async () => {
        console.log("📬 Dispatching Sunday Morning Newsletter...");
        await this.runNewsletterJob();
      },
      {
        timezone: "UTC",
      }
    );
    this.tasks.push(newsletterTask);
    console.log("✅ Weekly Newsletter scheduled: Every Sunday at 07:00 UTC");

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
        // Limited Daily run: Only fetch 7 days for core South Africa regions
        // All other regions are fetched 'On-Demand' when a user requests them
        const coreRegions = ["western-cape", "eastern-cape"];
        regionResults = await fetchAllRegionsData(7, coreRegions);
        console.log("✅ Core region data fetch completed:", {
          regionsProcessed: regionResults.regionsProcessed,
          regionsSucceeded: regionResults.regionsSucceeded,
          regionsFailed: regionResults.regionsFailed,
        });
      } catch (error) {
      }
 
      // Step 1.5: Process User Subscription Life Cycle (Trial Expirations)
      console.log("⚓ Step 1.5: Processing trial expirations");
      try {
        const { prisma } = require("../lib/prisma");
        const { sendEmail } = await import("../lib/email");
        const { trialExpiredTemplate } = await import("../lib/emailTemplates");
        
        const now = new Date();
        
        // Find users whose trial has ended but hasn't been processed yet
        const expiredTrials = await prisma.user.findMany({
          where: {
            hasActiveTrial: true,
            trialEndDate: {
              lt: now
            },
            hasTrialEnded: false
          }
        });

        if (expiredTrials.length > 0) {
          console.log(`🔌 Detected ${expiredTrials.length} expired trials. Processing...`);
          
          for (const user of expiredTrials) {
            try {
              // 1. Send Email
              await sendEmail(
                user.email,
                "Your Tactical Trial has Concluded ⚓",
                trialExpiredTemplate(user.name)
              );
              
              // 2. Update Database
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  hasActiveTrial: false,
                  hasTrialEnded: true,
                  subscriptionStatus: "EXPIRED_TRIAL"
                }
              });
              
              console.log(`✅ Trial expiration processed for user: ${user.id}`);
            } catch (userError) {
              console.error(`❌ Failed to process trial expiration for user ${user.id}:`, userError);
            }
          }
        } else {
          console.log("✅ No new trial expirations to process.");
        }
      } catch (trialError) {
        console.error("❌ Trial expiration processing failed:", trialError);
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

  /**
   * Run the weekly newsletter job
   * Generates AI report and sends to all opted-in users
   */
  async runNewsletterJob() {
    const startTime = Date.now();
    console.log("📨 Starting Newsletter Broadcast...");

    try {
      const { prisma } = require("../lib/prisma");
      const { sendEmail } = await import("../lib/email");
      const { weeklyNewsletterTemplate } = await import("../lib/emailTemplates");
      const { IntelligenceService } = await import("./intelligenceService");
      const { generateUnsubscribeToken } = await import("../lib/tokens");
      
      const CATEGORY = "WEEKLY_INTEL";

      console.log("🧠 Generating AI Intelligence Report...");
      const { report: aiReport, presenterName } = await IntelligenceService.generateWeeklyReport();
      
      // 2. Get the date range string (Next 7 days)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
      const weekDates = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      // 3. Create an EmailBlast record (logging the start)
      const blast = await prisma.emailBlast.create({
        data: {
          name: `Weekly Tactical Intel: ${weekDates}`,
          category: CATEGORY,
          metadata: { aiReportSummary: aiReport.substring(0, 100) }
        }
      });

      // 4. Find all opted-in users
      // A user is opted in IF they don't have an opt-out record for this category
      const subscribers = await prisma.user.findMany({
        where: {
          notificationPreferences: {
            none: {
              category: CATEGORY,
              isOptedIn: false
            }
          }
        },
        select: { id: true, email: true, name: true }
      });

      console.log(`📣 Sending intelligence to ${subscribers.length} subscribers...`);

      let successCount = 0;
      let failCount = 0;

      const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

      for (const user of subscribers) {
        try {
          // Generate unique unsubscribe token
          const token = generateUnsubscribeToken(user.id, CATEGORY);
          const unsubscribeUrl = `${backendUrl}/api/preferences/unsubscribe?token=${token}`;
          const subject = `Weekly Tactical Intelligence: Muizenberg [${weekDates}] 🛰️`;

          const success = await sendEmail(
            user.email,
            subject,
            weeklyNewsletterTemplate(user.name, aiReport, weekDates, unsubscribeUrl, presenterName)
          );
          
          if (success) successCount++;
          else failCount++;
        } catch (err) {
          console.error(`❌ Failed to send newsletter to ${user.email}:`, err);
          failCount++;
        }
      }

      // 5. Update blast record with stats
      await prisma.emailBlast.update({
        where: { id: blast.id },
        data: {
          metadata: {
            ...((blast.metadata as object) || {}),
            successCount,
            failCount,
            totalSubscribers: subscribers.length,
            durationMs: Date.now() - startTime
          }
        }
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Newsletter Broadcast Complete: ${successCount} sent, ${failCount} failed. Total time: ${duration}ms`);
      
      return {
        success: true,
        sent: successCount,
        failed: failCount,
        duration: `${duration}ms`,
        blastId: blast.id
      };
    } catch (error) {
      console.error("❌ Newsletter Job Failed:", error);
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
