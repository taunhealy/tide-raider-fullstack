import { Router, Request, Response } from "express";
import { ScoreService } from "../services/scoreService";
import { prisma } from "../lib/prisma";
import {
  optionalAuth,
  authenticateToken,
  AuthRequest,
} from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

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
 * GET /api/beach-ratings/historical?regionId=bali&period=today
 * Get historical beach scores for a region over a time period
 * Use dataRateLimiter for this frequently called endpoint
 */
router.get(
  "/historical",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { regionId, period, source } = req.query;

      if (!regionId) {
        return res.status(400).json({ error: "regionId is required" });
      }

      // Default to WINDFINDER if no source specified
      const selectedSource =
        (source as "WINDFINDER" | "WINDGURU" | "WINDY") || "WINDFINDER";

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      const endDate = new Date(now);
      endDate.setUTCHours(23, 59, 59, 999);

      switch (period) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setUTCHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setUTCHours(0, 0, 0, 0);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          startDate.setUTCHours(0, 0, 0, 0);
          break;
        case "3years":
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 3);
          startDate.setUTCHours(0, 0, 0, 0);
          break;
        case "today":
        default:
          startDate = new Date(now);
          startDate.setUTCHours(0, 0, 0, 0);
          break;
      }

      // Resolve regionId (could be slug or UUID)
      let resolvedRegionId = regionId as string;
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          resolvedRegionId
        );

      if (!isUUID) {
        const region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: resolvedRegionId },
              { name: { contains: resolvedRegionId, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });

        if (!region) {
          return res.json({
            beaches: [],
            period: period || "today",
            dateRange: { start: startDate, end: endDate },
          });
        }

        resolvedRegionId = region.id;
      }

      // Get beaches for the region
      const beaches = await prisma.beach.findMany({
        where: { regionId: resolvedRegionId },
        include: {
          region: true,
          beachDailyScores: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
              source: selectedSource,
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      });

      // Calculate total scores for the period
      const beachesWithScores = beaches.map((beach) => {
        const scores = beach.beachDailyScores;
        const totalScore = scores.reduce(
          (sum, score) => sum + (score.score || 0),
          0
        );
        const appearances = scores.length;

        return {
          id: beach.id,
          name: beach.name,
          region: beach.region,
          totalScore: totalScore,
          appearances,
          latestScore: scores[0]?.score || 0,
        };
      });

      // Sort by total score for all periods, or latest score for today
      const sortedBeaches = beachesWithScores.sort((a, b) =>
        period === "today"
          ? b.latestScore - a.latestScore
          : b.totalScore - a.totalScore
      );

      return res.json({
        beaches: sortedBeaches,
        period: period || "today",
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    } catch (error) {
      console.error("[beach-ratings] Error fetching historical scores:", error);
      return res.status(500).json({
        error: "Failed to fetch historical beach ratings",
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
