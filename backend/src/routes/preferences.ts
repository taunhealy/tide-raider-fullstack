import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { PreferenceService } from "../services/preferenceService";
import { verifyUnsubscribeToken } from "../lib/tokens";
import { NotificationCategory } from "@prisma/client";

const router = Router();

/**
 * GET /api/preferences/unsubscribe
 * Unauthenticated unsubscription via signed token
 */
router.get("/unsubscribe", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing or invalid token" });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Expired or invalid security token" });
  }

  try {
    await PreferenceService.updatePreference(payload.userId, payload.category, false);
    
    // Redirect to a success page on the frontend
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return res.redirect(`${baseUrl}/unsubscribe?success=true&category=${payload.category}`);
  } catch (error) {
    console.error("[PreferencesRoute] Unsubscribe failed:", error);
    return res.status(500).json({ error: "Failed to process unsubscription" });
  }
});

/**
 * GET /api/preferences/me
 * Get preferences for the logged-in user
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const preferences = await PreferenceService.getUserPreferences(authReq.user.id);
    return res.json(preferences);
  } catch (error) {
    console.error("[PreferencesRoute] Get preferences failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/preferences/update
 * Update preferences for the logged-in user
 */
router.post("/update", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { category, isOptedIn } = req.body;

    if (!category || typeof isOptedIn !== "boolean") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Validate category exists in Enum
    if (!Object.values(NotificationCategory).includes(category)) {
      return res.status(400).json({ error: "Invalid notification category" });
    }

    await PreferenceService.updatePreference(authReq.user.id, category, isOptedIn);
    return res.json({ success: true });
  } catch (error) {
    console.error("[PreferencesRoute] Update preference failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
