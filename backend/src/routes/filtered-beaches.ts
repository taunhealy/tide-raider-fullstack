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

router.get("/test-endpoint", (req, res) => {
  res.json({ message: "Filtered Beaches Route is ACTIVE", timestamp: new Date().toISOString() });
});

// GET /api/filtered-beaches?regionId=xxx&searchQuery=xxx&...
// Use dataRateLimiter for this endpoint as it's called frequently
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    console.log("[filtered-beaches] Received request:", req.query);
    try {
      const regionIdParam = (req.query.regionId as string)?.toLowerCase();
      const searchQuery = req.query.searchQuery
        ? (req.query.searchQuery as string).trim()
        : undefined;
      const sourceParam =
        (req.query.source as "WINDFINDER" | "WINDGURU" | "WINDY") ||
        "WINDFINDER";

      let regionId: string | undefined = undefined;

      if (regionIdParam) {
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

        if (region) {
          regionId = region.id;
        } else {
          return res.status(404).json({ error: `Region not found: ${regionIdParam}` });
        }
      }

      // Handle array parameters properly
      const crimeLevelParam = req.query.crimeLevel as string | undefined;
      const crimeLevels = crimeLevelParam
        ? (crimeLevelParam.split(",") as CrimeLevel[])
        : undefined;

      const whereClause: Prisma.BeachWhereInput = {
        ...(regionId && { regionId }),
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

      // Add isHiddenGem filter logic:
      // If true, only show hidden gems (REQUIRES AUTHENTICATION).
      // If false/missing, exclude hidden gems (include false and null).
      if (req.query.isHiddenGem === "true") {
        if ((req as any).user?.isSubscribed) {
          whereClause.isHiddenGem = true;
        } else {
          // User requested hidden gems but is not subscribed - return 0 results
          whereClause.id = "force-zero-results"; 
        }
      } else {
        // Exclude true (include false and null)
        // Using AND with OR to avoid clashing with other filters
        whereClause.AND = [
          {
            OR: [
              { isHiddenGem: false },
              { isHiddenGem: null }
            ]
          }
        ];
      }

      // Add isLongboarding filter if specified
      if (req.query.isLongboarding === "true") {
        whereClause.isLongboarding = true;
      }

      console.log("[filtered-beaches] isHiddenGem filter:", req.query.isHiddenGem);
      console.log("[filtered-beaches] isLongboarding filter:", req.query.isLongboarding);
      console.log("[filtered-beaches] whereClause:", JSON.stringify(whereClause, null, 2));


      const timeSlotParam = (req.query.timeSlot as string) || "MORNING";

      // Get date from query params or default to today
      const forecastDateParam = (req.query.forecastDate || req.query.date) as string | undefined;
      let targetDate: Date;

      if (forecastDateParam) {
        const [year, month, day] = forecastDateParam.split("-").map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
      }

      // 🚨 CRITICAL FIX: Calculate source switching BEFORE the cache check
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine the "True Source" based on date depth
      // Windfinder (Superforecast) only goes 3 days deep.
      let effectiveSource = sourceParam;
      if (sourceParam === "WINDFINDER" && diffDays > 3) {
        effectiveSource = "WINDGURU";
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
        timeSlot: true,
        regionId: true,
        source: true,
        trend: true,
        tide: true,
      };

      // Limit UI to 3 days behind and 7 days ahead (10 days total)
      const pastLimit = new Date(today);
      pastLimit.setUTCDate(today.getUTCDate() - 3);

      const futureLimit = new Date(today);
      futureLimit.setUTCDate(today.getUTCDate() + 7);

      // Parallel queries: forecast lookup, score check, and available dates
      const [exactForecast, scoreCheck, availableForecastDates] = await Promise.all([
        // Try exact match with the EFFECTIVE source first
        regionId ? prisma.forecast.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: effectiveSource as any,
            timeSlot: timeSlotParam as any,
          },
          select: forecastSelect,
        }) : Promise.resolve(null),
        // Check if scores exist
        regionId ? prisma.beachDailyScore.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: effectiveSource as any,
            timeSlot: timeSlotParam as any,
          },
          select: {
            score: true,
            beachId: true,
          },
        }) : Promise.resolve(null),
        // Get available dates
        prisma.forecast.findMany({
          where: {
            ...(regionId && { regionId }),
            source: { in: ["WINDFINDER", "WINDGURU"] },
            date: { 
              gte: pastLimit,
              lte: futureLimit
            },
          },
          select: {
            date: true,
          },
          distinct: [Prisma.ForecastScalarFieldEnum.date],
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      let forecast = exactForecast;

      // 🔄 CROSS-SOURCE FALLBACK (Alternative Provider)
      if (!forecast && regionId) {
        const alternateSource = effectiveSource === "WINDFINDER" ? "WINDGURU" : "WINDFINDER";
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: alternateSource as any,
            timeSlot: timeSlotParam as any,
          },
          select: forecastSelect,
        });
        if (forecast) {
          console.log(`[filtered-beaches] 🔀 Using alternate source ${alternateSource} cache to prevent reload.`);
        }
      }

      // 🕒 SLOT FALLBACK (Same Day, Different Time)
      // If we have data for the day but just not this specific slot, don't re-scrape!
      if (!forecast && regionId) {
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            date: targetDate,
            source: effectiveSource as any,
          },
          orderBy: {
            // Find the closest available slot
            timeSlot: "asc" 
          },
          select: forecastSelect,
        });
        if (forecast) {
          console.log(`[filtered-beaches] 🕒 Using slot fallback for ${targetDate.toISOString().split('T')[0]} to prevent reload.`);
        }
      }
      const availableDates = availableForecastDates.map((f) => 
        f.date.toISOString().split("T")[0]
      );

      // If no exact forecast, try fallback (same source/slot, most recent)
      if (!forecast && regionId) {
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId,
            source: effectiveSource as any,
            timeSlot: timeSlotParam as any,
            date: { lte: targetDate },
          },
          orderBy: { date: "desc" },
          select: forecastSelect,
        });
      }

      // If still no forecast, trigger on-demand scraping as fallback
      if (!forecast && regionId) {
        console.log(
          `[filtered-beaches] 🚨 No forecast found for ${regionId} (${sourceParam}/${timeSlotParam}) on ${targetDate.toISOString().split("T")[0]}, triggering scrape...`
        );
        console.log(
          `[filtered-beaches] ⏱️ Starting scrape at ${new Date().toISOString()}`
        );

        try {
          // Calculate distance from today in days
          let effectiveSource = sourceParam;
          // 🚨 AUTOMATIC SOURCE SWITCHING: If date > 3 days out, Superforecast won't have it.
          if (sourceParam === "WINDFINDER" && diffDays > 3) {
            console.log(`[filtered-beaches] 📅 Date is ${diffDays} days away (beyond Superforecast window). Switching to WINDGURU.`);
            effectiveSource = "WINDGURU";
          }

          const scrapeStartTime = Date.now();
          const scrapedForecast = await getLatestConditions(
            regionId,
            false, // Don't force refresh - only scrape if no data
            effectiveSource,
            undefined, // daysLimit
            targetDate,
            timeSlotParam
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
                timeSlot: scrapedForecast.timeSlot,
              }
            );
            // Query the forecast again after scraping
            const finalSource = (sourceParam === "WINDFINDER" && diffDays > 3) ? "WINDGURU" : sourceParam;
            forecast = await prisma.forecast.findFirst({
              where: {
                regionId,
                date: targetDate,
                source: finalSource,
                timeSlot: timeSlotParam as any,
              },
              select: forecastSelect,
            });

            // SECONDARY FALLBACK: If Windfinder returned null (even for near dates), try Windguru
            if (!forecast && sourceParam === "WINDFINDER" && diffDays <= 3) {
               console.log(`[filtered-beaches] 🔄 SECONDARY FALLBACK: Windfinder null, attempting WINDGURU...`);
               await getLatestConditions(regionId, false, "WINDGURU");
               forecast = await prisma.forecast.findFirst({
                 where: {
                   regionId,
                   date: targetDate,
                   source: "WINDGURU",
                   timeSlot: timeSlotParam as any,
                 },
                 select: forecastSelect,
               });
            }
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
      if (forecast && !scoreCheck && regionId) {
        // Scores don't exist - calculate them synchronously so user sees them
        // This is rare (scores should already be in DB from cron jobs)
        try {
          await ScoreService.calculateAndStoreScores(regionId, {
            ...forecast,
            date: targetDate,
            timeSlot: timeSlotParam,
          });
        } catch (error) {
          console.error(`[filtered-beaches] Score calculation failed:`, error);
          // Continue anyway - return beaches without scores
        }
      }

      // Step 3: Fetch beaches and hidden gem count in parallel
      // Use the actual source we found the forecast for (respecting fallbacks)
      const dataMappingSource = forecast?.source || ((sourceParam === "WINDFINDER" && diffDays > 3) ? "WINDGURU" : sourceParam);

      const [beaches, hiddenGemCount] = await Promise.all([
        prisma.beach.findMany({
          where: whereClause,
          include: {
            region: true,
            conditionProfiles: {
              where: {
                category: "GENERAL"
              }
            },
            beachDailyScores: {
              where: {
                date: targetDate,
                source: dataMappingSource as any,
                timeSlot: timeSlotParam as any,
                category: "GENERAL",
              },
              orderBy: { score: "desc" },
              take: 1,
              select: {
                score: true,
                conditions: true,
                date: true,
                timeSlot: true,
              },
            },
            // Fetch the single latest public log entry to eliminate frontend N+1 fetches
            logEntries: {
              where: { isPrivate: false, isAnonymous: false },
              orderBy: { date: 'desc' },
              take: 1,
              select: {
                id: true,
                date: true,
                surferRating: true,
                comments: true,
                imageUrl: true,
                surferName: true
              }
            }
          },
        }),
        prisma.beachDailyScore.count({
          where: {
            regionId: regionId as string,
            date: targetDate,
            source: dataMappingSource as any,
            timeSlot: timeSlotParam as any,
            score: { gte: 8 },
            beach: {
              isHiddenGem: true
            }
          }
        })
      ]);

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
          const { beachDailyScores, conditionProfiles, ...beachData } = beach as any;
          const profile = conditionProfiles?.[0] || {};
          return {
            ...beachData,
            optimalWindDirections: profile.optimalWindDirections || [],
            optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
            swellSize: profile.swellSize || { min: 0, max: 10 },
            idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
            optimalTide: profile.optimalTide || "ALL",
          };
        }),
        scores,
        forecast,
        availableDates,
        hiddenGemCount,
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
// Triggering reload for proximity expansion support - check 1
