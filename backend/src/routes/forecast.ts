import { Router, Request, Response } from "express";
import { getLatestConditions } from "../services/surfConditionsService";
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

      // Parse target date if provided
      let targetDate: Date | undefined;
      if (forecastDateParam) {
        const [year, month, day] = forecastDateParam.split("-").map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      }

      // If a specific date is requested, query directly from database
      if (targetDate) {
        const { prisma } = await import("../lib/prisma");
        let forecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: sourceParam,
          },
        });

        // If forecast found, return it immediately
        if (forecast) {
          // Validate that the forecast has the correct source
          const forecastSource = (forecast as any).source;
          if (forecastSource && forecastSource !== sourceParam) {
            console.error(
              `[forecast] ⚠️ WARNING: Forecast source mismatch! Requested: ${sourceParam}, Got: ${forecastSource}`
            );
          }
          console.log(
            `[forecast] 📤 Returning forecast for ${targetDate.toISOString().split("T")[0]} (source: ${forecastSource || "unknown"})`
          );
          return res.json(forecast);
        }
        
        // If not found, don't trigger scraping during user requests
        // Scraping should happen in background cron jobs, not during API requests
        console.log(
          `[forecast] ⚠️ No forecast found for exact date ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}), trying fallback...`
        );

        // If exact date not found, try to find the most recent available forecast for this source
        // Don't trigger scraping during user requests - scraping should happen in background
        console.log(
          `[forecast] ⚠️ No forecast found for exact date ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}), trying to find most recent...`
        );
        const mostRecentForecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            source: sourceParam,
            date: {
              lte: targetDate, // Only look for dates <= requested date
            },
          },
          orderBy: {
            date: "desc", // Get the most recent one
          },
        });

        if (mostRecentForecast) {
          console.log(
            `[forecast] ✅ Found most recent forecast for ${mostRecentForecast.date.toISOString().split("T")[0]} (source: ${sourceParam}), returning as fallback`
          );
          return res.json(mostRecentForecast);
        }

        // If still no forecast found, try any source (fallback to any available forecast)
        const anyForecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            date: {
              lte: targetDate,
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        if (anyForecast) {
          console.log(
            `[forecast] ✅ Found forecast for ${anyForecast.date.toISOString().split("T")[0]} (source: ${(anyForecast as any).source}), returning as fallback`
          );
          return res.json(anyForecast);
        }

        // Don't trigger scraping during user requests - return 404 instead
        // Scraping should happen in background cron jobs, not during API requests
        console.log(
          `[forecast] ⚠️ No forecast data available in database for ${regionId} on ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}). Scraping should happen in background.`
        );
        return res
          .status(404)
          .json({ error: "No forecast data found for the requested date" });
      }

      // Use the existing getLatestConditions function that handles scraping and caching
      const forecast = await getLatestConditions(
        regionId,
        forceRefresh,
        sourceParam
      );

      if (!forecast) {
        return res.status(404).json({ error: "No forecast data found" });
      }

      // Validate that the forecast has the correct source
      const forecastSource = (forecast as any).source;
      if (forecastSource && forecastSource !== sourceParam) {
        console.error(
          `[forecast] ⚠️ WARNING: Forecast source mismatch! Requested: ${sourceParam}, Got: ${forecastSource}`
        );
      }
      console.log(
        `[forecast] 📤 Returning forecast (source: ${forecastSource || "unknown"}, windSpeed: ${forecast.windSpeed}, swellHeight: ${forecast.swellHeight})`
      );
      return res.json(forecast);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }
  }
);

export default router;
