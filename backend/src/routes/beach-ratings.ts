import { Router, Request, Response } from "express";
import { ScoreService } from "../services/scoreService";
import {
  optionalAuth,
  authenticateToken,
  AuthRequest,
} from "../middleware/auth";

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

/**
 * POST /api/beach-ratings/calculate
 * Calculate and store scores for a region and date
 * Body: { regionId: string, date?: string, forecast?: {...} }
 */
router.post(
  "/calculate",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { regionId, date, forecast } = req.body;

      if (!regionId) {
        return res.status(400).json({ error: "regionId is required" });
      }

      const targetDate = date ? new Date(date) : new Date();
      targetDate.setUTCHours(0, 0, 0, 0);

      if (!forecast) {
        return res.status(400).json({ error: "forecast data is required" });
      }

      const scores = await ScoreService.calculateAndStoreScores(regionId, {
        ...forecast,
        date: targetDate,
      });

      return res.json({
        success: true,
        regionId,
        date: targetDate,
        scoresCalculated: scores.length,
      });
    } catch (error) {
      console.error("[beach-ratings] Error calculating scores:", error);
      return res.status(500).json({
        error: "Failed to calculate scores",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
