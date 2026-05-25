import { Router, Response } from "express";
import { IntelligenceService } from "../services/intelligenceService";
import { authenticateToken, optionalAuth, AuthRequest } from "../middleware/auth";


const router = Router();

// Existing daily report (mini-intel)
router.get("/report", async (req, res) => {
  const { beach, windSpeed, windDir, swellHeight, swellPeriod, swellDir, score, persona, date, trend } = req.query;

  if (!beach || !persona || !date) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const report = await IntelligenceService.getReport(
        beach as string,
        parseFloat(windSpeed as string || "0"),
        windDir as string || "N",
        parseFloat(swellHeight as string || "0"),
        parseFloat(swellPeriod as string || "0"),
        swellDir as string || "W",
        parseFloat(score as string || "0"),
        (persona as string).toUpperCase(),
        date as string,
        trend as string
    );

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI intelligence" });
  }
});

/**
 * Premium Weekly Strategic AI Report
 * Costs 1 Credit (R1)
 */
router.post("/weekly", authenticateToken, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { beachId, date, persona, days = 7, category = "GENERAL", source = "WINDY" } = req.body;
  const userId = authReq.user?.id;

  if (!beachId || !date || !userId) {
    return res.status(400).json({ error: "Missing required parameters: beachId, date, and user authentication are required." });
  }

  const parsedDays = parseInt(days as string) || 7;

  try {
    const result = await IntelligenceService.getTimedReportForBeach(
      beachId,
      date,
      userId,
      parsedDays,
      persona,
      category,
      source
    );

    res.json(result);
  } catch (error: any) {
    console.error("[IntelligenceRoute] Intelligence report error:", error);
    
    if (error.message === "INSUFFICIENT_CREDITS") {
      const creditCost = parsedDays <= 1 ? 1 : 4;
      return res.status(402).json({ 
        error: "Insufficient credits", 
        message: `You need at least ${creditCost} credit${creditCost > 1 ? 's' : '' } to generate this ${parsedDays}-day report.` 
      });
    }

    if (error.message === "Beach not found") {
      return res.status(404).json({ error: "Beach not found" });
    }

    res.status(500).json({ 
      error: "Failed to generate tactical intelligence",
      message: error.message || "An unknown error occurred during intelligence generation."
    });
  }
});

/**
 * Share Intelligence Report via Email
 */
router.post("/share-email", authenticateToken, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { email, beachName, reportText, dateRange } = req.body;

  if (!email || !beachName || !reportText) {
    return res.status(400).json({ error: "Missing required parameters for sharing" });
  }

  try {
    const { sendEmail } = await import("../lib/email");
    
    // Format date header
    const windowHeader = dateRange ? `<div style="font-weight: 800; font-size: 14px; color: #6366f1; margin-bottom: 20px; letter-spacing: 0.1em; text-transform: uppercase;">Strategic Window: ${dateRange}</div>` : "";

    const htmlReport = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #000; color: #fff; padding: 8px 16px; border-radius: 8px; font-weight: 900; font-size: 12px; letter-spacing: 0.1em; margin-bottom: 12px;">TIDE RAIDER INTEL</div>
          <h2 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; padding: 0;">${beachName}</h2>
          <p style="color: #64748b; font-size: 11px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.2em;">Weekly Strategic Briefing</p>
        </div>

        ${windowHeader}

        <div style="background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #f1f5f9; white-space: pre-wrap; font-size: 15px; line-height: 1.7; color: #334155; font-weight: 500;">
          ${reportText.replace(/\n/g, '<br/>')}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600;">
          © ${new Date().getFullYear()} TIDE RAIDER INTEL. SIGNAL SECURED BY A COMRADE.<br/>
          <a href="https://tideraider.ai" style="color: #6366f1; text-decoration: none; margin-top: 8px; display: inline-block;">Ready to raid? Join the hunt.</a>
        </div>
      </div>
    `;

    const success = await sendEmail(
      email,
      `Tactical Intel: ${beachName} ${dateRange ? `[${dateRange}]` : ""} 🌊`,
      htmlReport
    );

    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to send intelligence email" });
    }
  } catch (error) {
    console.error("[IntelligenceRoute] Sharing error:", error);
    res.status(500).json({ error: "Internal server error during sharing" });
  }
});

/**
 * Share Intelligence Report via WhatsApp (Evolution API)
 */
router.post("/share-whatsapp", authenticateToken, async (req, res: Response) => {
  const { number, beachName, reportText } = req.body;

  if (!number || !beachName || !reportText) {
    return res.status(400).json({ error: "Missing required parameters for WhatsApp sharing" });
  }

  try {
    const { whatsappService } = await import("../services/whatsappService");
    
    const message = `🌊 *TIDE RAIDER INTEL: ${beachName.toUpperCase()}*\n\n${reportText}\n\nJoin the hunt: tideraider.ai`;
    
    // Format number to ensure it has a plus if it's potentially local, but the service handles clean-up
    const result = await whatsappService.sendMessage({
      to: number,
      message: message
    });

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      console.error("[IntelligenceRoute] WhatsApp send failure:", result.error);
      res.status(500).json({ error: result.error || "Failed to dispatch WhatsApp signal" });
    }
  } catch (error) {
    console.error("[IntelligenceRoute] WhatsApp sharing internal error:", error);
    res.status(500).json({ error: "Internal server error during WhatsApp dispatch" });
  }
});

/**
 * GET /api/intelligence/user/:userId/history
 * Fetch tactical reports contributed by a specific operator
 */
router.get("/user/:userId/history", async (req, res: Response) => {
  const { userId } = req.params;

  try {
    const { prisma } = await import("../lib/prisma");
    const reports = await prisma.intelligenceReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        beach: {
          select: {
            name: true,
            id: true,
            regionId: true
          }
        },
        user: {
          select: {
             id: true,
             name: true,
             image: true
          }
        }
      }
    });

    res.json(reports);
  } catch (error) {
    console.error("[IntelligenceRoute] User reports fetch error:", error);
    res.status(500).json({ error: "Failed to fetch operator's tactical log." });
  }
});

/**
 * GET /api/intelligence/global-latest
 * Fetch the absolute most recent intelligence report generated in the system
 */
router.get("/global-latest", async (req, res: Response) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const report = await prisma.intelligenceReport.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        beach: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            instagram: true,
            link: true
          }
        }
      }
    });

    res.json(report || null);
  } catch (error) {
    console.error("[IntelligenceRoute] Global latest report fetch error:", error);
    res.status(500).json({ error: "Failed to fetch absolute latest tactical signal." });
  }
});

/**
 * GET /api/intelligence/history
 * Fetch recent intelligence reports globally
 */
router.get("/history", optionalAuth, async (req, res: Response) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const reports = await prisma.intelligenceReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        beach: {
          select: {
            name: true,
            id: true,
            regionId: true,
            countryId: true,
            continent: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            instagram: true,
            link: true
          }
        }
      }
    });

    res.json(reports);
  } catch (error) {
    console.error("[IntelligenceRoute] History fetch error:", error);
    res.status(500).json({ error: "Failed to fetch report history" });
  }
});

/**
 * GET /api/intelligence/latest
 * Find the most recent report for a specific beach/user
 */
router.get("/latest", optionalAuth, async (req, res: Response) => {
  const { beachId, source } = req.query;

  if (!beachId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const { prisma } = await import("../lib/prisma");
    const whereClause: any = { beachId: beachId as string };
    if (source) {
      whereClause.source = (source as string).toUpperCase();
    }
    const report = await prisma.intelligenceReport.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            instagram: true,
            link: true
          }
        }
      }
    });

    res.json(report || null);
  } catch (error) {
    console.error("[IntelligenceRoute] Latest report fetch error:", error);
    res.status(500).json({ error: "Failed to verify existing intelligence" });
  }
});

/**
 * GET /api/intelligence/beach/:beachId/history
 * Fetch chronological IDs for navigate through reports of a specific beach
 */
router.get("/beach/:beachId/history", optionalAuth, async (req, res: Response) => {
  const { beachId } = req.params;
  const { source } = req.query;

  if (!beachId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const { prisma } = await import("../lib/prisma");
    const whereClause: any = { beachId };
    if (source) {
      whereClause.source = (source as string).toUpperCase();
    }
    const reports = await prisma.intelligenceReport.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: { 
        id: true,
        date: true,
        duration: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            instagram: true,
            link: true
          }
        }
      }
    });

    res.json(reports);
  } catch (error) {
    console.error("[IntelligenceRoute] Beach history fetch error:", error);
    res.status(500).json({ error: "Failed to fetch beach report sequence" });
  }
});

/**
 * GET /api/intelligence/report/:id
 * Fetch a single report by ID
 */
router.get("/report/:id", optionalAuth, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;

  try {
    const { prisma } = await import("../lib/prisma");
    const report = await prisma.intelligenceReport.findUnique({
      where: { id },
      include: {
        beach: true,
        user: {
          select: {
            id: true,
            name: true,
            instagram: true,
            link: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("[IntelligenceRoute] Single report fetch error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

export default router;
