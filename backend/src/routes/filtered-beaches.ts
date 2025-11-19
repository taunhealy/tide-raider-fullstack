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

      console.log(
        `[filtered-beaches] Request received for regionId: ${regionIdParam}, source: ${sourceParam}`
      );

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

        console.log(
          `[filtered-beaches] 🔍 Searching for region with name variations:`,
          {
            original: regionIdParam,
            nameFromSlug,
          }
        );

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

        if (!region) {
          // Log available regions for debugging
          console.log("[DEBUG] About to query regions with findMany...");
          console.log("[DEBUG] Prisma client instance:", !!prisma);
          console.log("[DEBUG] Region ID being searched:", regionIdParam);

          try {
            const allRegions = await prisma.region.findMany({
              select: { id: true, name: true },
              take: 20,
            });
            console.log("[DEBUG] Query executed successfully");
            console.log("[DEBUG] Number of regions found:", allRegions.length);
            console.log(
              "[DEBUG] Query result:",
              JSON.stringify(allRegions, null, 2)
            );
            console.log(
              `[filtered-beaches] 🔍 Sample of available regions in database:`,
              allRegions.map((r) => `${r.id} -> "${r.name}"`)
            );
          } catch (queryError: any) {
            console.error("[DEBUG] Query failed with error:", queryError);
            console.error("[DEBUG] Error message:", queryError.message);
            console.error("[DEBUG] Error stack:", queryError.stack);
          }
        }
      }

      if (!region) {
        console.log(`[filtered-beaches] ❌ Region not found: ${regionIdParam}`);
        return res
          .status(404)
          .json({ error: `Region not found: ${regionIdParam}` });
      }

      const regionId = region.id; // Use resolved database region ID
      console.log(
        `[filtered-beaches] ✅ Region resolved: ${region.id} (name: ${region.name}, from: ${regionIdParam})`
      );

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

      // Get date from query params or default to today
      const forecastDateParam = req.query.forecastDate as string | undefined;
      let targetDate: Date;

      if (forecastDateParam) {
        // Parse the date string (YYYY-MM-DD format) - parse manually to avoid timezone issues
        const [year, month, day] = forecastDateParam.split("-").map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        console.log(
          `[filtered-beaches] 📅 Parsed forecastDate param: "${forecastDateParam}" -> ${targetDate.toISOString()}`
        );
      } else {
        // Default to today
        targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
        console.log(
          `[filtered-beaches] 📅 No forecastDate param, using today: ${targetDate.toISOString()}`
        );
      }

      // Step 1: Get or fetch forecast data for the requested source
      console.log(
        `[filtered-beaches] 🔍 Querying forecast for regionId: ${regionId}, date: ${targetDate.toISOString()}, source: ${sourceParam}`
      );
      let forecast = await prisma.forecast.findFirst({
        where: {
          regionId,
          date: targetDate,
          source: sourceParam, // Use the requested source
        },
        select: {
          windSpeed: true,
          windDirection: true,
          swellHeight: true,
          swellPeriod: true,
          swellDirection: true,
          date: true,
        },
      });

      console.log(`[filtered-beaches] 📊 Forecast query result:`, {
        found: !!forecast,
        regionId,
        date: targetDate.toISOString(),
      });

      // If no forecast exists for the target date, try to scrape it
      // The scraper fetches ALL available forecast days (today, tomorrow, etc.) in one run
      if (!forecast) {
        try {
          console.log(
            `[filtered-beaches] ⚠️ No forecast found for ${targetDate.toISOString().split("T")[0]}, triggering scrape...`
          );

          // Force a scrape for the requested source - this will fetch ALL available forecast days and store them
          // forceRefresh=true ensures we scrape even if today's data already exists
          const scrapedForecast = await getLatestConditions(
            regionId,
            true,
            sourceParam
          );

          if (scrapedForecast) {
            console.log(
              `[filtered-beaches] ✅ Scrape completed, querying for target date: ${targetDate.toISOString().split("T")[0]}`
            );

            // After scraping, query again for the target date (scraper stores all days)
            const updatedForecast = await prisma.forecast.findFirst({
              where: {
                regionId,
                date: targetDate,
                source: sourceParam, // Use the requested source
              },
              select: {
                windSpeed: true,
                windDirection: true,
                swellHeight: true,
                swellPeriod: true,
                swellDirection: true,
                date: true,
              },
            });

            if (updatedForecast) {
              forecast = updatedForecast;
              console.log(
                `[filtered-beaches] ✅ Found forecast for ${targetDate.toISOString().split("T")[0]} after scrape`
              );
            } else {
              console.log(
                `[filtered-beaches] ⚠️ Still no forecast for ${targetDate.toISOString().split("T")[0]} after scrape - may not be available on source page`
              );
            }
          }
        } catch (error) {
          console.error(
            `[filtered-beaches] ❌ Failed to scrape forecast for ${targetDate.toISOString().split("T")[0]}:`,
            error
          );
        }
      }

      // If forecast found, ensure date matches
      if (forecast) {
        forecast.date = targetDate;
      }

      // Step 2: Check if scores exist for the target date and if they match the requested source
      const existingScores = await prisma.beachDailyScore.count({
        where: {
          regionId,
          date: targetDate,
        },
      });

      // Check if existing scores were calculated with a different source
      // We store the source in the conditions JSON, so we can check it
      const existingScoresData = await prisma.beachDailyScore.findMany({
        where: {
          regionId,
          date: targetDate,
        },
        select: {
          score: true,
          beachId: true,
          conditions: true,
        },
        take: 5, // Sample first 5
      });

      const allScoresZero =
        existingScoresData.length > 0 &&
        existingScoresData.every((s) => s.score === 0);

      // Always recalculate scores when forecast exists to ensure they match the requested source
      // Since scores are stored per beach/date (not per source), we need to recalculate
      // whenever a different source is selected to get accurate scores
      const needsRecalculation =
        forecast && (existingScores === 0 || allScoresZero || true); // Always recalculate when forecast exists to ensure scores match the selected source

      console.log(`Existing scores sample:`, existingScoresData);
      console.log(`All scores are zero: ${allScoresZero}`);
      console.log(`Needs recalculation: ${needsRecalculation}`);

      // Step 3: Calculate scores if they don't exist OR if source changed
      // Only calculate scores if we have forecast data for the target date
      if (needsRecalculation && forecast) {
        console.log(
          `${existingScores === 0 ? "Calculating" : "Recalculating"} scores for ${regionId} on ${targetDate.toISOString().split("T")[0]}...`
        );
        try {
          await ScoreService.calculateAndStoreScores(regionId, {
            ...forecast,
            date: targetDate,
          });
          console.log("✓ Scores calculated and stored");

          // Verify scores were created and log sample values
          const verifyScores = await prisma.beachDailyScore.findMany({
            where: {
              regionId,
              date: targetDate,
            },
            select: {
              beachId: true,
              score: true,
            },
            take: 5,
          });
          console.log(
            `✓ Verified ${verifyScores.length} scores exist for ${regionId}`
          );
          console.log(`Sample calculated scores:`, verifyScores);
        } catch (error) {
          console.error("Failed to calculate scores:", error);
        }
      } else if (existingScores === 0) {
        console.log(
          `⚠ No forecast data available for ${regionId}, cannot calculate scores`
        );
      } else {
        console.log(
          `✓ Using existing scores (${existingScores} beaches) for ${regionId}`
        );
      }

      // Step 4: Fetch beaches with their daily scores for the target date
      console.log(
        `[filtered-beaches] 🔍 Querying beaches for regionId: ${regionId} with filters:`,
        {
          searchQuery: searchQuery || "none",
          filters: Object.keys(whereClause).filter((k) => k !== "regionId"),
          targetDate: targetDate.toISOString().split("T")[0],
        }
      );
      const beaches = await prisma.beach.findMany({
        where: whereClause,
        include: {
          region: true,
          beachDailyScores: {
            where: { date: targetDate },
            select: {
              score: true,
              conditions: true,
              date: true,
            },
          },
        },
      });

      console.log(`[filtered-beaches] 📊 Database query successful:`, {
        beachCount: beaches.length,
        regionId,
        hasScores: beaches.filter((b) => b.beachDailyScores.length > 0).length,
        beachesWithScores: beaches.filter((b) => b.beachDailyScores.length > 0)
          .length,
      });

      // EXTRA DEBUG: if no beaches are found, inspect what's actually in the DB
      if (beaches.length === 0) {
        console.log(
          `[filtered-beaches][DEBUG] No beaches returned for regionId=${regionId}. Inspecting DB...`
        );

        const sampleBeaches = await prisma.beach.findMany({
          select: { id: true, name: true, regionId: true, countryId: true },
          take: 10,
        });
        console.log(
          "[filtered-beaches][DEBUG] Sample beaches in DB (first 10):",
          sampleBeaches
        );

        const regionBeaches = await prisma.beach.findMany({
          where: { regionId },
          select: { id: true, name: true, regionId: true, countryId: true },
          take: 10,
        });
        console.log(
          `[filtered-beaches][DEBUG] Beaches for regionId=${regionId}:`,
          regionBeaches
        );
      }

      // Transform scores into a flat dictionary, ensuring the full beach object is included.
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
              beachDailyScores: dailyScore ? [dailyScore] : [], // Ensure beachDailyScores is an array
            },
          };
          return acc;
        },
        {}
      );

      console.log(
        `Transformed scores object has ${Object.keys(scores).length} entries`
      );
      console.log(
        `Sample scores:`,
        Object.entries(scores)
          .slice(0, 3)
          .map(([id, data]) => ({ beachId: id, score: data.score }))
      );

      // Log the response structure
      const responseData = {
        beaches: beaches.map((beach) => {
          const { beachDailyScores, ...beachData } = beach;
          return beachData;
        }),
        scores,
        forecast,
        totalCount: beaches.length,
      };

      console.log(`[filtered-beaches] ✅ Success - preparing response:`, {
        beachCount: responseData.beaches.length,
        scoreCount: Object.keys(responseData.scores).length,
        hasForecast: !!responseData.forecast,
        sampleScoreKeys: Object.keys(responseData.scores).slice(0, 3),
      });

      // Return transformed data structure
      return res.json(responseData);
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
