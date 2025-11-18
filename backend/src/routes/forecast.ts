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
            source: "WINDFINDER", // Prefer WINDFINDER source
          },
        });

        // If not found, trigger scrape to get all available forecast days
        if (!forecast) {
          console.log(
            `[forecast] ⚠️ No forecast found for ${targetDate.toISOString().split("T")[0]}, triggering scrape...`
          );
          
          // Force a scrape - this will fetch ALL available forecast days and store them
          const scrapedForecast = await getLatestConditions(regionId, true);
          
          if (scrapedForecast) {
            console.log(
              `[forecast] ✅ Scrape completed, querying for target date: ${targetDate.toISOString().split("T")[0]}`
            );
            
            // Query again after scraping
            forecast = await prisma.forecast.findFirst({
              where: {
                regionId,
                date: targetDate,
                source: "WINDFINDER", // Prefer WINDFINDER source
              },
            });
            
            if (forecast) {
              console.log(
                `[forecast] ✅ Found forecast for ${targetDate.toISOString().split("T")[0]} after scrape`
              );
            } else {
              console.log(
                `[forecast] ⚠️ Still no forecast for ${targetDate.toISOString().split("T")[0]} after scrape - may not be available on source page`
              );
            }
          }
        }

        if (forecast) {
          return res.json(forecast);
        }

        return res.status(404).json({ error: "No forecast data found for the requested date" });
      }

      // Use the existing getLatestConditions function that handles scraping and caching
      const forecast = await getLatestConditions(regionId, forceRefresh);

      if (!forecast) {
        return res.status(404).json({ error: "No forecast data found" });
      }

      return res.json(forecast);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }
  }
);

export default router;
