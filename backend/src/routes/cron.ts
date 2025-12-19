import { Router, Request, Response } from "express";
import { fetchAllRegionsData } from "../services/regionDataService";
import { processAllUserAlerts } from "../services/alertProcessor";
import { prisma } from "../lib/prisma";

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
    internalCronEnabled: process.env.ENABLE_CRON !== "false",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/cron/run-now - Manually trigger cron job (for testing/admin)
router.post("/run-now", async (req: Request, res: Response) => {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = req.headers["x-cron-secret"];
    if (cronSecret !== process.env.CRON_SECRET) {
      console.warn("Unauthorized cron run-now attempt - invalid secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { getCronScheduler } = await import("../services/cronScheduler");
    const scheduler = getCronScheduler();
    const result = await scheduler.runNow();

    return res.json({
      message: "Cron job executed successfully",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error running cron job:", error);
    return res.status(500).json({
      error: "Failed to run cron job",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/cron/run-weekly - Trigger full weekly scrape
router.post("/run-weekly", async (req: Request, res: Response) => {
  try {
    const cronSecret = req.headers["x-cron-secret"];
    if (cronSecret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { getCronScheduler } = await import("../services/cronScheduler");
    const result = await getCronScheduler().runWeeklyJob();
    return res.json(result);
  } catch (error) {
    console.error("❌ Error running weekly job:", error);
    return res.status(500).json({ error: "Weekly job failed" });
  }
});

// GET /api/cron/test - Test endpoint (development only, no auth required)
router.get("/test", async (req: Request, res: Response) => {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      error: "Test endpoint only available in development",
    });
  }

  try {
    const { getCronScheduler } = await import("../services/cronScheduler");
    const scheduler = getCronScheduler();
    const result = await scheduler.runNow();

    return res.json({
      message: "Cron job executed successfully (test mode)",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error running cron job:", error);
    return res.status(500).json({
      error: "Failed to run cron job",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});


// POST /api/cron/process-payouts - Monthly Payout Job
// Trigger this on the 1st of every month
router.post("/process-payouts", async (req: Request, res: Response) => {
  try {
     const cronSecret = req.headers["x-cron-secret"];
     if (cronSecret !== process.env.CRON_SECRET) {
       return res.status(401).json({ error: "Unauthorized" });
     }

     console.log("💰 Starting Monthly Payout Processing...");

     // 1. Get all PENDING commissions
     const pendingCommissions = await prisma.commission.findMany({
       where: { status: "PENDING" },
       include: { partner: { include: { partnerProfile: true } } }
     });

     if (pendingCommissions.length === 0) {
       return res.json({ message: "No pending commissions to pay." });
     }

     // 2. Group by Partner
     const payoutsByPartner = new Map<string, {
       email: string,
       amount: number,
       commissionIds: string[]
     }>();

     for (const comm of pendingCommissions) {
       const email = comm.partner.partnerProfile?.paypalEmail;
       if (!email) continue; // Skip if no paypal email set

       if (!payoutsByPartner.has(comm.partnerId)) {
         payoutsByPartner.set(comm.partnerId, { email, amount: 0, commissionIds: [] });
       }
       
       const entry = payoutsByPartner.get(comm.partnerId)!;
       entry.amount += comm.amount;
       entry.commissionIds.push(comm.id);
     }

     // 3. Prepare Batch Items
     const batchItems: any[] = [];
     const commissionIdsToUpdate: string[] = [];
     const MIN_PAYOUT_THRESHOLD = 20.00; // Only pay if > $20 to save fees - Updated per user request

     for (const [partnerId, data] of payoutsByPartner) {
        if (data.amount >= MIN_PAYOUT_THRESHOLD) {
           batchItems.push({
             recipient_type: "EMAIL",
             amount: {
               value: data.amount.toFixed(2),
               currency: "USD"
             },
             note: "Tide Raider Monthly Affiliate Commission",
             sender_item_id: `payout_${partnerId}_${Date.now()}`,
             receiver: data.email
           });
           commissionIdsToUpdate.push(...data.commissionIds);
        } else {
          console.log(`Skipping payout for ${data.email} - Below threshold ($${data.amount.toFixed(2)})`);
        }
     }

     // 4. Send Batch
    if (batchItems.length > 0) {
      const { PayPalService } = await import("../services/paypal"); // Dynamic import
      await PayPalService.sendBatchPayout(batchItems);

      // 5. Update DB Status
      await prisma.commission.updateMany({
        where: { id: { in: commissionIdsToUpdate } },
        data: {
          status: "PAID",
          paidAt: new Date()
        }
      });
      console.log(`✅ Successfully paid out ${batchItems.length} partners.`);
    }

     return res.json({
       success: true,
       processedCount: batchItems.length,
       totalPending: pendingCommissions.length
     });

  } catch (error) {
    console.error("❌ Payout Job Failed:", error);
    res.status(500).json({ error: "Payout failed" });
  }
});

export default router;
