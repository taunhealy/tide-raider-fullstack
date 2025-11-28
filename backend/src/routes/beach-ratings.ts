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
      const { regionId, period } = req.query;

      if (!regionId) {
        return res.status(400).json({ error: "regionId is required" });
      }

      // Calculate date range based on period
      // Calculate date range based on period or specific date
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      const dateParam = req.query.date as string;

      if (dateParam) {
        // Specific date requested
        startDate = new Date(dateParam);
        startDate.setUTCHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setUTCHours(23, 59, 59, 999);
      } else {
        // Period-based range (defaulting to today)
        endDate = new Date(now);
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

      // Get beaches for the region with scores from ALL sources
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
              // Remove source filter to get scores from all sources
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      });

      // Calculate total scores for the period, aggregating across all sources
      const beachesWithScores = beaches.map((beach) => {
        const scores = beach.beachDailyScores;
        
        // Aggregate scores across all sources
        const totalScore = scores.reduce(
          (sum, score) => sum + (score.score || 0),
          0
        );
        
        // Count unique date appearances (not source appearances)
        const uniqueDates = new Set(
          scores.map(score => score.date.toISOString().split('T')[0])
        );
        const appearances = uniqueDates.size;

        // For latest score, get the sum of all sources for the most recent date
        const latestDate = scores.length > 0 ? scores[0].date : null;
        const latestScores = latestDate 
          ? scores.filter(s => s.date.getTime() === latestDate.getTime())
          : [];
        const latestScore = latestScores.reduce(
          (sum, score) => sum + (score.score || 0),
          0
        );

        return {
          id: beach.id,
          name: beach.name,
          region: beach.region,
          totalScore: totalScore,
          appearances,
          latestScore: latestScore,
        };
      });

      // Filter out beaches with no scores (totalScore = 0)
      const beachesWithValidScores = beachesWithScores.filter(
        (beach) => beach.totalScore > 0
      );

      // Debug logging
      console.log(`[beach-ratings/historical] Region: ${resolvedRegionId}, Period: ${period}`);
      console.log(`[beach-ratings/historical] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`[beach-ratings/historical] Total beaches in region: ${beaches.length}`);
      
      if (beaches.length > 0) {
        const firstBeach = beaches[0];
        console.log(`[beach-ratings/historical] First beach (${firstBeach.name}) scores count: ${firstBeach.beachDailyScores.length}`);
        if (firstBeach.beachDailyScores.length > 0) {
          console.log(`[beach-ratings/historical] First beach first score:`, firstBeach.beachDailyScores[0]);
        }
      }

      console.log(`[beach-ratings/historical] Beaches with scores > 0: ${beachesWithValidScores.length}`);

      // Sort by total score for all periods, or latest score for today
      // If specific date is requested, sort by total score for that date (which is effectively latestScore logic since range is 1 day)
      const sortedBeaches = beachesWithValidScores.sort((a, b) =>
        (period === "today" || dateParam)
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
