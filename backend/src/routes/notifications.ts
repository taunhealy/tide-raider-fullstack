import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/notifications/count - Get notification count for authenticated user
router.get("/count", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Count unread notifications (if you have a notifications table)
    // For now, return 0 as a placeholder
    const count = 0;

    return res.json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return res.status(500).json({ error: "Failed to fetch notification count" });
  }
});

export default router;

