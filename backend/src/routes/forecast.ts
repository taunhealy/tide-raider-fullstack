import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// GET /api/forecast?regionId=xxx&forceRefresh=true
// Use dataRateLimiter for this frequently called endpoint
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const regionId = req.query.regionId as string;
      const forceRefresh = req.query.forceRefresh === "true";
      const forecastDateParam = req.query.forecastDate as string | undefined;
      const sourceParam =
        (req.query.source as "WINDFINDER" | "WINDGURU" | "WINDY") ||
        "WINDFINDER";

      if (!regionId) {
        return res.status(400).json({ error: "Region ID is required" });
      }

      // Parse target date - default to today if not provided
      let targetDate: Date;
      if (forecastDateParam) {
        const [year, month, day] = forecastDateParam.split("-").map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
      }

      // Try exact match first (fastest - uses unique index)
      let forecast = await prisma.forecast.findFirst({
        where: {
          regionId,
          date: targetDate,
          source: sourceParam,
        },
      });

      // If not found, try most recent from same source only (no cross-source fallback)
      if (!forecast) {
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            source: sourceParam,
            date: {
              lte: targetDate,
            },
          },
          orderBy: {
            date: "desc",
          },
        });
      }

      if (!forecast) {
        return res
          .status(404)
          .json({ error: `No forecast data found for ${sourceParam}` });
      }

      return res.json(forecast);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }
  }
);

export default router;
