import { Router, Request, Response } from "express";
import { ScoreService } from "../services/scoreService";
import { optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/beach-ratings/region-counts?date=2025-11-16
 * Get count of beaches with score >= 8 (4+ stars) per region for a given date
 */
router.get(
  "/region-counts",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const counts = await ScoreService.getRegionCounts(date);

      return res.json({ counts });
    } catch (error) {
      console.error("[beach-ratings] Error fetching region counts:", error);
      return res.status(500).json({
        error: "Failed to fetch region counts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;

