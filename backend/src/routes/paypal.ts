import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// POST /api/paypal/cancel - Cancel subscription or end trial
router.post("/cancel", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        hasActiveTrial: true,
        paypalSubscriptionId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user is on trial, end the trial
    if (user.hasActiveTrial || user.subscriptionStatus === "TRIAL") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasActiveTrial: false,
          hasTrialEnded: true,
          subscriptionStatus: "INACTIVE",
        },
      });

      console.log(`[paypal/cancel] ✅ Ended trial for user: ${user.id}`);
      return res.json({
        success: true,
        message: "Trial ended successfully",
        subscriptionStatus: "INACTIVE",
      });
    }

    // If user has PayPal subscription, cancel it
    if (user.paypalSubscriptionId) {
      // TODO: Cancel PayPal subscription via API if needed
      // For now, just update the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "CANCELLED",
          paypalSubscriptionId: null,
        },
      });

      console.log(`[paypal/cancel] ✅ Cancelled subscription for user: ${user.id}`);
      return res.json({
        success: true,
        message: "Subscription cancelled successfully",
        subscriptionStatus: "CANCELLED",
      });
    }

    // User has no active subscription or trial
    return res.status(400).json({
      error: "No active subscription or trial",
      message: "You don't have an active subscription or trial to cancel.",
    });
  } catch (error) {
    console.error("[paypal/cancel] Error:", error);
    return res.status(500).json({
      error: "Failed to cancel subscription",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

export default router;

