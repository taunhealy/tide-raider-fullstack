import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ScoreService } from "../services/scoreService";
import { getLatestConditions } from "../services/surfConditionsService";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";
import {
  Season,
  Prisma,
  OptimalTide,
  WaveType,
  CrimeLevel,
  Difficulty,
  Hazard,
} from "@prisma/client";

const router = Router();

// GET /api/filtered-beaches?regionId=xxx&searchQuery=xxx&...
// Use dataRateLimiter for this endpoint as it's called frequently
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const regionIdParam = (req.query.regionId as string)?.toLowerCase();
      const searchQuery = req.query.searchQuery
        ? (req.query.searchQuery as string).trim()
        : undefined;
      const sourceParam =
        (req.query.source as "WINDFINDER" | "WINDGURU" | "WINDY") ||
        "WINDFINDER";

      if (!regionIdParam) {
        return res.status(400).json({ error: "regionId is required" });
      }

      // Resolve regionId to actual database region ID
      let region = await prisma.region.findUnique({
        where: { id: regionIdParam },
      });

      // If not found by ID, try to find by name (case-insensitive)
      if (!region) {
        const nameFromSlug = regionIdParam
          .split("-")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");

        region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: regionIdParam },
              { name: { equals: nameFromSlug, mode: "insensitive" } },
              { name: { equals: regionIdParam, mode: "insensitive" } },
              { name: { contains: regionIdParam, mode: "insensitive" } },
              { name: { contains: nameFromSlug, mode: "insensitive" } },
            ],
          },
        });
      }

      if (!region) {
        return res
          .status(404)
          .json({ error: `Region not found: ${regionIdParam}` });
      }

      const regionId = region.id;

      // Handle array parameters properly
      const crimeLevelParam = req.query.crimeLevel as string | undefined;
      const crimeLevels = crimeLevelParam
        ? (crimeLevelParam.split(",") as CrimeLevel[])
        : undefined;

      const whereClause: Prisma.BeachWhereInput = {
        regionId,
        ...(searchQuery && {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              location: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }),
        ...(req.query.optimalTide && {
          optimalTide: req.query.optimalTide as OptimalTide,
        }),
        ...(req.query.waveType && {
          waveType: req.query.waveType as WaveType,
        }),
        ...(crimeLevels && {
          crimeLevel: {
            in: crimeLevels,
          },
        }),
        ...(req.query.bestSeasons && {
          bestSeasons: {
            hasSome: (req.query.bestSeasons as string).split(",") as Season[],
          },
        }),
        ...(req.query.difficulty && {
          difficulty: req.query.difficulty as Difficulty,
        }),
        ...(req.query.hazards && {
          hazards: {
            hasSome: (req.query.hazards as string).split(",") as Hazard[],
          },
        }),
      };

      // Add isHiddenGem filter if specified
      if (req.query.isHiddenGem === "true") {
        whereClause.isHiddenGem = true;
      }

      // Add isLongboarding filter if specified
      if (req.query.isLongboarding === "true") {
        whereClause.isLongboarding = true;
      }

      console.log("[filtered-beaches] isHiddenGem filter:", req.query.isHiddenGem);
      console.log("[filtered-beaches] isLongboarding filter:", req.query.isLongboarding);
      console.log("[filtered-beaches] whereClause:", JSON.stringify(whereClause, null, 2));


      // Get date from query params or default to today
      const forecastDateParam = req.query.forecastDate as string | undefined;
      let targetDate: Date;

      if (forecastDateParam) {
        const [year, month, day] = forecastDateParam.split("-").map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
      }

      // Step 1: Get forecast data and check scores in parallel for better performance
      const forecastSelect = {
        id: true,
        windSpeed: true,
        windDirection: true,
        swellHeight: true,
        swellPeriod: true,
        swellDirection: true,
        date: true,
        regionId: true,
        source: true,
      };

      // Parallel queries: forecast lookup and score check
      const [exactForecast, scoreCheck] = await Promise.all([
        // Try exact match first
        prisma.forecast.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: sourceParam,
          },
          select: forecastSelect,
        }),
        // Check if scores exist (single query instead of count + findMany)
        prisma.beachDailyScore.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: sourceParam,
          },
          select: {
            score: true,
            beachId: true,
          },
        }),
      ]);

      let forecast = exactForecast;

      // If no exact forecast, try fallback (same source, most recent)
      if (!forecast) {
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            source: sourceParam,
            date: { lte: targetDate },
          },
          orderBy: { date: "desc" },
          select: forecastSelect,
        });
      }

      // If still no forecast, trigger on-demand scraping as fallback
      if (!forecast) {
        console.log(
          `[filtered-beaches] 🚨 No forecast found for ${regionId} (${sourceParam}) on ${targetDate.toISOString().split("T")[0]}, triggering scrape...`
        );
        console.log(
          `[filtered-beaches] ⏱️ Starting scrape at ${new Date().toISOString()}`
        );

        try {
          // getLatestConditions will scrape if no data exists for today
          // forceRefresh=false means it checks DB first, only scrapes if needed
          const scrapeStartTime = Date.now();
          const scrapedForecast = await getLatestConditions(
            regionId,
            false, // Don't force refresh - only scrape if no data
            sourceParam
          );
          const scrapeDuration = Date.now() - scrapeStartTime;

          console.log(
            `[filtered-beaches] ⏱️ Scrape completed in ${scrapeDuration}ms`
          );

          if (scrapedForecast) {
            console.log(
              `[filtered-beaches] ✅ Scraping successful for ${regionId} (${sourceParam})`,
              {
                windSpeed: scrapedForecast.windSpeed,
                swellHeight: scrapedForecast.swellHeight,
                date: scrapedForecast.date,
              }
            );
            // Query the forecast again after scraping
            forecast = await prisma.forecast.findFirst({
              where: {
                regionId,
                date: targetDate,
                source: sourceParam,
              },
              select: forecastSelect,
            });
            console.log(
              `[filtered-beaches] 📊 Re-queried forecast after scraping:`,
              forecast ? "FOUND" : "NOT FOUND"
            );
          } else {
            console.warn(
              `[filtered-beaches] ⚠️ Scraping returned null/undefined for ${regionId} (${sourceParam})`
            );
          }
        } catch (scrapeError) {
          console.error(
            `[filtered-beaches] ❌ Error during on-demand scraping for ${regionId} (${sourceParam}):`,
            {
              error:
                scrapeError instanceof Error
                  ? scrapeError.message
                  : String(scrapeError),
              stack:
                scrapeError instanceof Error ? scrapeError.stack : undefined,
            }
          );
          // Continue anyway - return null forecast and let UI handle it
        }
      }

      // Ensure date matches target date
      if (forecast) {
        forecast.date = targetDate;
      }

      // Step 2: Calculate scores only if they don't exist and we have forecast
      // Most common case: scores exist, so we skip this entirely (fast path)
      if (forecast && !scoreCheck) {
        // Scores don't exist - calculate them synchronously so user sees them
        // This is rare (scores should already be in DB from cron jobs)
        try {
          await ScoreService.calculateAndStoreScores(regionId, {
            ...forecast,
            date: targetDate,
          });
        } catch (error) {
          console.error(`[filtered-beaches] Score calculation failed:`, error);
          // Continue anyway - return beaches without scores
        }
      }

      // Step 3: Fetch beaches with their daily scores for the target date
      const beaches = await prisma.beach.findMany({
        where: whereClause,
        include: {
          region: true,
          beachDailyScores: {
            where: {
              date: targetDate,
              source: sourceParam,
            },
            select: {
              score: true,
              conditions: true,
              date: true,
            },
          },
        },
      });

      // Transform scores into a flat dictionary
      const scores = beaches.reduce(
        (
          acc: Record<
            string,
            { score: number; beach: (typeof beaches)[number] }
          >,
          beach
        ) => {
          const dailyScore =
            beach.beachDailyScores.length > 0
              ? beach.beachDailyScores[0]
              : null;
          acc[beach.id] = {
            score: dailyScore?.score ?? 0,
            beach: {
              ...beach,
              beachDailyScores: dailyScore ? [dailyScore] : [],
            },
          };
          return acc;
        },
        {}
      );

      // Return response
      return res.json({
        beaches: beaches.map((beach) => {
          const { beachDailyScores, ...beachData } = beach;
          return beachData;
        }),
        scores,
        forecast,
        totalCount: beaches.length,
      });
    } catch (error: any) {
      console.error("API Error:", error);

      // If database is unavailable, return empty structure instead of 500
      // This allows the frontend to gracefully handle the error
      if (
        error?.code === "P1001" || // Can't reach database server
        error?.name === "PrismaClientInitializationError" ||
        error?.message?.includes("Can't reach database server")
      ) {
        console.warn(
          "[filtered-beaches] Database unavailable, returning empty structure"
        );
        return res.json({
          beaches: [],
          scores: {},
          forecast: null,
          totalCount: 0,
        });
      }

      return res
        .status(500)
        .json({ error: "Failed to fetch filtered beaches" });
    }
  }
);

export default router;
