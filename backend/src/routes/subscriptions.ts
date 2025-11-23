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

export default router;

