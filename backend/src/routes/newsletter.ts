import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import { newsletterWelcomeTemplate } from "../lib/emailTemplates";
import { NotificationCategory } from "@prisma/client";

const router = Router();

/**
 * POST /api/newsletter/subscribe
 * Public endpoint to subscribe to the weekly newsletter
 */
router.post("/subscribe", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    // 1. Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Create a minimal "GUEST" user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: email.split("@")[0],
          // Default role is SURFER, which is fine
        },
      });
      console.log(`[newsletter] Created new guest user for subscription: ${user.id}`);
    }

    // 2. Ensure Intelligence preference is OPTED-IN
    // Use upsert for the preference
    await prisma.userNotificationPreference.upsert({
      where: {
        userId_category: {
          userId: user.id,
          category: NotificationCategory.WEEKLY_INTEL,
        },
      },
      update: {
        isOptedIn: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        category: NotificationCategory.WEEKLY_INTEL,
        isOptedIn: true,
      },
    });

    // 3. Send welcome email
    await sendEmail(
      user.email,
      "Intelligence Pipeline Connected 🛰️",
      newsletterWelcomeTemplate(user.name || "Commander")
    );

    return res.json({ 
      success: true, 
      message: "Subscription successful! Verification email sent." 
    });
  } catch (error) {
    console.error("[newsletter] Subscription error:", error);
    return res.status(500).json({ error: "Subscription failed. Please try again later." });
  }
});

export default router;
