import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { notifyAdminNewTrial } from "../lib/adminNotifications";

const router = Router();

// POST /api/subscriptions/start-trial - Start a free trial for the user
router.post(
  "/start-trial",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has an active trial or has used their trial
      if (user.hasActiveTrial || user.hasTrialEnded) {
        return res.status(400).json({
          error: "Trial already used",
          message: "You have already used your free trial.",
        });
      }

      // Calculate trial end date (7 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      // Update user with trial information
      const updatedUser = await prisma.user.update({
        where: { id: authReq.user.id },
        data: {
          hasActiveTrial: true,
          trialStartDate: new Date(),
          trialEndDate: trialEndDate,
          subscriptionStatus: "TRIAL",
        },
        select: {
          id: true,
          email: true,
          name: true,
          trialEndDate: true,
        },
      });

      console.log(
        `[subscriptions] ✅ Started trial for user: ${authReq.user.id}, trial ends: ${trialEndDate.toISOString()}`
      );
      
      // Notify admin of new trial (async, don't wait)
      notifyAdminNewTrial(updatedUser).catch((err) =>
        console.error("Failed to send admin notification:", err)
      );

      // Send welcome email to user (async, don't wait)
      try {
        const { sendEmail } = await import("../lib/email");
        const { trialStartedTemplate } = await import("../lib/emailTemplates");
        
        sendEmail(
          updatedUser.email,
          "Welcome to the Tactical Feed 🌊",
          trialStartedTemplate(updatedUser.name)
        ).catch(err => console.error("Failed to send trial welcome email:", err));
      } catch (err) {
        console.error("Context error for welcome email:", err);
      }

      return res.json({
        success: true,
        trialEndDate: trialEndDate.toISOString(),
      });
    } catch (error) {
      console.error("[subscriptions] ❌ Start trial error:", error);
      return res.status(500).json({
        error: "Failed to start trial",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

// POST /api/subscriptions/activate-trial-with-code - Activate 1-month trial with promo code
router.post(
  "/activate-trial-with-code",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { promoCode } = req.body;

      if (!promoCode || typeof promoCode !== "string") {
        return res.status(400).json({
          error: "Invalid request",
          message: "Promo code is required",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Normalize promo code to uppercase for case-insensitive lookup
      const normalizedCode = promoCode.toUpperCase().trim();
      
      console.log(`[promo-code] Looking up code: "${promoCode}" -> normalized: "${normalizedCode}"`);

      // Find the promo code (case-insensitive)
      const code = await prisma.promoCode.findUnique({
        where: { code: normalizedCode },
      });
      
      console.log(`[promo-code] Code lookup result:`, code ? { id: code.id, code: code.code, isActive: code.isActive } : "not found");

      if (!code) {
        // Log available codes for debugging (in development only)
        if (process.env.NODE_ENV === "development") {
          const allCodes = await prisma.promoCode.findMany({
            select: { code: true, isActive: true },
          });
          console.log(`[promo-code] Available codes:`, allCodes.map(c => c.code));
        }
        
        return res.status(404).json({
          error: "Invalid code",
          message: "The promo code you entered is invalid.",
        });
      }

      if (!code.isActive) {
        return res.status(400).json({
          error: "Code inactive",
          message: "This promo code is no longer active.",
        });
      }

      // Check if code has reached max uses
      if (code.maxUses !== null && code.usedCount >= code.maxUses) {
        return res.status(400).json({
          error: "Code expired",
          message: "This promo code has reached its usage limit.",
        });
      }

      // Check if user has already used this code
      const existingUsage = await prisma.promoCodeUsage.findUnique({
        where: {
          promoCodeId_userId: {
            promoCodeId: code.id,
            userId: user.id,
          },
        },
      });

      if (existingUsage) {
        return res.status(400).json({
          error: "Code already used",
          message: "You have already used this promo code.",
        });
      }

      // Check if user already has an active subscription or trial
      if (
        user.subscriptionStatus === "ACTIVE" ||
        (user.hasActiveTrial && user.trialEndDate && new Date() < user.trialEndDate)
      ) {
        return res.status(400).json({
          error: "Already subscribed",
          message: "You already have an active subscription or trial.",
        });
      }

      // Calculate trial end date (using trialDays from promo code, default 30 days)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + code.trialDays);

      // Start transaction to update user and record usage
      const result = await prisma.$transaction(async (tx) => {
        // Update user with trial information
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            hasActiveTrial: true,
            trialStartDate: new Date(),
            trialEndDate: trialEndDate,
            subscriptionStatus: "TRIAL",
            hasTrialEnded: false,
          },
          select: {
            id: true,
            email: true,
            name: true,
            trialEndDate: true,
          },
        });

        // Record promo code usage
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: code.id,
            userId: user.id,
          },
        });

        // Increment used count
        await tx.promoCode.update({
          where: { id: code.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });

        return updatedUser;
      });

      console.log(
        `[subscriptions] ✅ Activated ${code.trialDays}-day trial with code ${code.code} for user: ${user.id}, trial ends: ${trialEndDate.toISOString()}`
      );

      // Notify admin of new trial (async, don't wait)
      notifyAdminNewTrial(result).catch((err) =>
        console.error("Failed to send admin notification:", err)
      );

      // Send welcome email to user (async, don't wait)
      try {
        const { sendEmail } = await import("../lib/email");
        const { trialStartedTemplate } = await import("../lib/emailTemplates");
        
        sendEmail(
          result.email,
          "Welcome to the Tactical Feed 🌊",
          trialStartedTemplate(result.name)
        ).catch(err => console.error("Failed to send trial welcome email:", err));
      } catch (err) {
        console.error("Context error for welcome email:", err);
      }

      return res.json({
        success: true,
        trialEndDate: trialEndDate.toISOString(),
        trialDays: code.trialDays,
        message: `Successfully activated ${code.trialDays}-day free trial!`,
      });
    } catch (error) {
      console.error("[subscriptions] ❌ Activate trial with code error:", error);
      return res.status(500).json({
        error: "Failed to activate trial",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

export default router;

