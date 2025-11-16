import { Router, Request, Response } from "express";
import { fetchAllRegionsData } from "../services/regionDataService";
import { processAllUserAlerts } from "../services/alertProcessor";

const router = Router();

// POST /api/cron/fetch-and-alert
// This will be called by external cron service (Vercel Cron, GitHub Actions, etc.)
// at different times for different timezones
router.post("/fetch-and-alert", async (req: Request, res: Response) => {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = req.headers["x-cron-secret"];
    if (cronSecret !== process.env.CRON_SECRET) {
      console.warn("Unauthorized cron attempt - invalid secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const timezone = (req.body?.timezone as string) || "UTC";
    const startTime = Date.now();

    console.log(`🕐 Starting cron job for timezone: ${timezone}`);
    console.log(`📅 Current time: ${new Date().toISOString()}`);

    // Step 1: Fetch and store surf conditions for all regions
    console.log("📊 Step 1: Fetching surf conditions for all regions");
    let regionResults;
    try {
      regionResults = await fetchAllRegionsData();
      console.log("✅ Region data fetch completed", regionResults);
    } catch (error) {
      console.error("❌ Failed to fetch region data:", error);
      return res.status(500).json({
        error: "Failed to fetch region data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Step 2: Process alerts for all users
    console.log("🔔 Step 2: Processing alerts for all users");
    let alertResults;
    try {
      alertResults = await processAllUserAlerts();
      console.log("✅ Alert processing completed", alertResults);
    } catch (error) {
      console.error("❌ Failed to process alerts:", error);
      return res.status(500).json({
        error: "Failed to process alerts",
        message: error instanceof Error ? error.message : "Unknown error",
        regionResults, // Include region results even if alerts fail
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Cron job completed in ${duration}ms`);

    return res.json({
      success: true,
      timezone,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      regionResults,
      alertResults,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return res.status(500).json({
      error: "Cron job failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/cron/health - Health check for cron endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    cronEnabled: !!process.env.CRON_SECRET,
    timestamp: new Date().toISOString(),
  });
});

export default router;
