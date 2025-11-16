import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, optionalAuth } from "../middleware/auth";

const router = Router();

// GET /api/notifications/count - Get notification count (0 if unauthenticated)
router.get("/count", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      // If not authenticated, just return 0 to avoid noisy 401s in the frontend
      return res.json({ count: 0 });
    }

    // Count unread notifications (if you have a notifications table)
    // For now, return 0 as a placeholder
    const count = 0;

    return res.json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch notification count" });
  }
});

export default router;
