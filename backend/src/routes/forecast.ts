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

        // Check if forecast has missing or invalid direction data
        // 0 values indicate missing data, values > 360 indicate corrupted data (timestamps)
        const hasMissingDirectionData =
          forecast &&
          (forecast.windDirection === 0 || forecast.swellDirection === 0);
        const hasInvalidDirectionData =
          forecast &&
          (forecast.windDirection > 360 || forecast.swellDirection > 360);

        // If not found OR has missing/invalid direction data, trigger scrape for the requested source
        if (!forecast || hasMissingDirectionData || hasInvalidDirectionData) {
          if (!forecast) {
            console.log(
              `[forecast] ⚠️ No forecast found for ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}), triggering scrape...`
            );
          } else if (hasInvalidDirectionData) {
            console.log(
              `[forecast] ⚠️ Forecast found but has invalid direction data (windDirection: ${forecast.windDirection}, swellDirection: ${forecast.swellDirection}) for ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}), re-scraping...`
            );
            // Delete the invalid forecast so it gets replaced
            await prisma.forecast.deleteMany({
              where: {
                regionId,
                date: targetDate,
                source: sourceParam,
              },
            });
          } else {
            console.log(
              `[forecast] ⚠️ Forecast found but has missing direction data (windDirection: ${forecast.windDirection}, swellDirection: ${forecast.swellDirection}) for ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}), re-scraping...`
            );
          }

          // Force a scrape for the requested source only
          try {
            const scrapedForecast = await getLatestConditions(
              regionId,
              true,
              sourceParam
            );
            console.log(
              `[forecast] ✅ Scrape completed for ${sourceParam}, querying for target date: ${targetDate.toISOString().split("T")[0]}`
            );

            // Query again after scraping
            forecast = await prisma.forecast.findFirst({
              where: {
                regionId,
                date: targetDate,
                source: sourceParam,
              },
            });

            if (forecast) {
              console.log(
                `[forecast] ✅ Found forecast for ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}) after scrape`
              );
            } else {
              console.log(
                `[forecast] ⚠️ Still no forecast for ${targetDate.toISOString().split("T")[0]} (source: ${sourceParam}) after scrape - may not be available on source page`
              );
            }
          } catch (scrapeError) {
            console.error(
              `[forecast] ❌ Error scraping ${sourceParam} for ${targetDate.toISOString().split("T")[0]}:`,
              scrapeError
            );
            // Don't throw - let it return 404 below
          }
        }

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

        // If exact date not found, try to find the most recent available forecast for this source
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
