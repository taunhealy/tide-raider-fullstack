import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";
import { getLatestConditions } from "../services/surfConditionsService";
import { ScoreService } from "../services/scoreService";

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
      const sourceParamRaw = req.query.source as string | undefined;

      if (!regionId) {
        return res.status(400).json({ error: "Region ID is required" });
      }

      // Validate and normalize source parameter
      const validSources = ["WINDFINDER", "WINDGURU", "WINDY"] as const;
      const sourceParam: "WINDFINDER" | "WINDGURU" | "WINDY" =
        sourceParamRaw && validSources.includes(sourceParamRaw as any)
          ? (sourceParamRaw as "WINDFINDER" | "WINDGURU" | "WINDY")
          : "WINDFINDER";

      if (sourceParamRaw && !validSources.includes(sourceParamRaw as any)) {
        console.warn(
          `[forecast] Invalid source parameter: ${sourceParamRaw}, defaulting to WINDFINDER`
        );
      }

      // Resolve regionId to actual database region ID (optimized: single query)
      const regionIdParam = regionId.toLowerCase();
      const nameFromSlug = regionIdParam
        .split("-")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      // Single query to find region by ID or name (more efficient than multiple queries)
      const region = await prisma.region.findFirst({
        where: {
          OR: [
            { id: regionIdParam },
            { name: { equals: nameFromSlug, mode: "insensitive" } },
            { name: { equals: regionIdParam, mode: "insensitive" } },
            { name: { contains: regionIdParam, mode: "insensitive" } },
            { name: { contains: nameFromSlug, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true }, // Only select what we need
      });

      if (!region) {
        return res.status(404).json({ error: `Region not found: ${regionId}` });
      }

      const resolvedRegionId = region.id;

      // Log region resolution for debugging
      if (regionIdParam !== resolvedRegionId) {
        console.log(
          `[forecast] Region ID resolved: "${regionIdParam}" -> "${resolvedRegionId}" (name: ${region.name})`
        );
      }

      // Parse target date - default to today if not provided
      let targetDate: Date;
      try {
        targetDate = forecastDateParam
          ? (() => {
              const [year, month, day] = forecastDateParam
                .split("-")
                .map(Number);
              if (isNaN(year) || isNaN(month) || isNaN(day)) {
                throw new Error(`Invalid date format: ${forecastDateParam}`);
              }
              const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
              if (isNaN(date.getTime())) {
                throw new Error(`Invalid date: ${forecastDateParam}`);
              }
              return date;
            })()
          : (() => {
              const date = new Date();
              date.setUTCHours(0, 0, 0, 0);
              return date;
            })();
      } catch (dateError) {
        console.error("[forecast] Date parsing error:", dateError);
        return res.status(400).json({
          error: "Invalid date format",
          message: `Invalid forecastDate parameter: ${forecastDateParam}. Expected format: YYYY-MM-DD`,
        });
      }

      const dateStr = targetDate.toISOString().split("T")[0];

      // Try to find existing forecast - Use findFirst for better compatibility with Date objects
      let forecast;
      try {
        console.log(`[forecast] 🔍 Querying database for: regionId=${resolvedRegionId}, date=${dateStr}, source=${sourceParam}`);
        forecast = await prisma.forecast.findFirst({
          where: {
            date: targetDate,
            regionId: resolvedRegionId,
            source: sourceParam,
          },
        });
      } catch (prismaError: any) {
        console.error("[forecast] Prisma query error:", {
          error: prismaError?.message,
          date: dateStr,
          regionId: resolvedRegionId,
          source: sourceParam,
        });
        return res.status(500).json({
          error: "Database query failed",
          message: "Failed to query forecast data from database",
          details: prismaError?.message
        });
      }

      if (!forecast) {
        console.log(
          `[forecast] No forecast found for regionId: ${resolvedRegionId} (original: ${regionId}), date: ${dateStr}, source: ${sourceParam}`
        );

        // Check if this is today or a future date - if so, trigger scraping
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const isTodayOrFuture = targetDate >= today;
        const isToday = targetDate.getTime() === today.getTime();

        if (isTodayOrFuture) {
          // Auto-scrape for today or future dates when data is missing
          // This ensures fresh data is available for current and upcoming dates
          console.log(
            `[forecast] 🚨 No forecast found for ${resolvedRegionId} (${sourceParam}) on ${dateStr}, triggering scrape...`
          );
          console.log(
            `[forecast] ⏱️ Starting scrape at ${new Date().toISOString()}`
          );

          try {
            const scrapeStartTime = Date.now();
            // getLatestConditions will scrape if no data exists
            // forceRefresh=false means it checks DB first, only scrapes if needed
            const scrapedForecast = await getLatestConditions(
              resolvedRegionId,
              forceRefresh, // Use the forceRefresh parameter from request
              sourceParam
            );
            const scrapeDuration = Date.now() - scrapeStartTime;

            console.log(
              `[forecast] ⏱️ Scrape completed in ${scrapeDuration}ms`
            );

            if (scrapedForecast) {
              console.log(
                `[forecast] ✅ Scraping successful for ${resolvedRegionId} (${sourceParam})`,
                {
                  windSpeed: scrapedForecast.windSpeed,
                  swellHeight: scrapedForecast.swellHeight,
                  date: scrapedForecast.date.toISOString().split("T")[0],
                }
              );

              // Query the forecast again after scraping
              forecast = await prisma.forecast.findFirst({
                where: {
                  date: targetDate,
                  regionId: resolvedRegionId,
                  source: sourceParam,
                },
              });

              if (forecast) {
                console.log(
                  `[forecast] 📊 Found forecast after scraping, returning data`
                );

                // Calculate scores for this forecast (if they don't exist)
                // This ensures the highscores widget has data
                try {
                  // Check if scores already exist for this date/source
                  const existingScores = await prisma.beachDailyScore.findFirst(
                    {
                      where: {
                        regionId: resolvedRegionId,
                        date: targetDate,
                        source: sourceParam,
                      },
                    }
                  );

                  if (!existingScores) {
                    console.log(
                      `[forecast] 📊 Calculating scores for ${resolvedRegionId} (${sourceParam}) on ${dateStr}`
                    );
                    await ScoreService.calculateAndStoreScores(
                      resolvedRegionId,
                      {
                        windSpeed: forecast.windSpeed,
                        windDirection: forecast.windDirection,
                        swellHeight: forecast.swellHeight,
                        swellPeriod: forecast.swellPeriod,
                        swellDirection: forecast.swellDirection,
                        date: forecast.date,
                        source: forecast.source,
                      }
                    );
                    console.log(
                      `[forecast] ✅ Scores calculated and stored for ${resolvedRegionId} (${sourceParam})`
                    );
                  } else {
                    console.log(
                      `[forecast] ℹ️ Scores already exist for ${resolvedRegionId} (${sourceParam}) on ${dateStr}, skipping calculation`
                    );
                  }
                } catch (scoreError: any) {
                  console.error(
                    `[forecast] ⚠️ Failed to calculate scores (non-fatal):`,
                    scoreError?.message
                  );
                  // Don't fail the request if score calculation fails
                }

                return res.json(forecast);
              } else {
                console.warn(
                  `[forecast] ⚠️ Forecast still not found after scraping for date ${dateStr} (scraped date: ${scrapedForecast.date.toISOString().split("T")[0]})`
                );
                // Fall through to return 404
              }
            } else {
              console.warn(
                `[forecast] ⚠️ Scraping returned null/undefined for ${resolvedRegionId} (${sourceParam})`
              );
            }
          } catch (scrapeError: any) {
            console.error(
              `[forecast] ❌ Error during on-demand scraping for ${resolvedRegionId} (${sourceParam}):`,
              {
                error: scrapeError?.message,
                stack: scrapeError?.stack,
              }
            );
            // Don't fail the request if scraping fails - just return 404
            // The scraping might have failed due to network issues, but we don't want to return 500
          }
        }

        // Return 404 if still no forecast found
        return res.status(404).json({
          error: `No forecast data found`,
          message: `No forecast data available for ${sourceParam} on ${dateStr} in region ${region.name || resolvedRegionId}`,
          regionId: resolvedRegionId,
          date: dateStr,
          source: sourceParam,
        });
      }

      return res.json(forecast);
    } catch (error: any) {
      console.error("[forecast] Unexpected error:", {
        error,
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      return res.status(500).json({
        error: "Failed to fetch forecast data",
        message: error?.message || "An unexpected error occurred",
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      });
    }
  }
);

export default router;
