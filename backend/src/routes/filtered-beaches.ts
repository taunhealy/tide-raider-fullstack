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
import { getCachedApiResponse, cacheApiResponse } from "../lib/redis";
import crypto from "crypto";

const router = Router();

router.get("/test-endpoint", (req, res) => {
  res.json({ message: "Filtered Beaches Route is ACTIVE", timestamp: new Date().toISOString() });
});

// GET /api/filtered-beaches?regionId=xxx&searchQuery=xxx&...
// Use dataRateLimiter for this endpoint as it's called frequently

// Helper function to fetch and compile data from database and cache it
async function fetchFilteredBeachesData(
  regionIdParam: string | undefined,
  searchQuery: string | undefined,
  sourceParam: string,
  user: any,
  isPremium: boolean,
  isGateEnabled: boolean,
  showHiddenGems: boolean,
  showRegular: boolean,
  timeSlotParam: string,
  targetDate: Date,
  diffDays: number,
  effectiveSource: string,
  whereClause: Prisma.BeachWhereInput,
  cacheKey: string
) {
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
      throw new Error(`Region not found: ${regionIdParam}`);
    }
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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Limit UI to 30 days behind and 7 days ahead
  const pastLimit = new Date(today);
  pastLimit.setUTCDate(today.getUTCDate() - 30);

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
        updatedAt: true,
      },
    }) : Promise.resolve(null),
    // Get available dates
    prisma.forecast.findMany({
      where: {
        ...(regionId && { regionId }),
        source: { in: ["WINDFINDER", "WINDGURU", "WINDY", "TIDE_RAIDER", "OPENMETEO_ARCHIVE"] },
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
  const allowFallback = true;
  if (!forecast && regionId && allowFallback) {
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
      console.log(`[filtered-beaches] 🔀 Using alternate source ${alternateSource} fallback.`);
    }
  }

  // 🕒 SLOT FALLBACK (Same Day, Different Time)
  if (!forecast && regionId) {
    forecast = await prisma.forecast.findFirst({
      where: {
        regionId,
        date: targetDate,
        source: effectiveSource as any,
      },
      orderBy: {
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

  // If still no forecast, trigger on-demand scraping or ensemble generation in the BACKGROUND
  if (!forecast && regionId) {
    if (sourceParam === "TIDE_RAIDER") {
      console.log(`🌊 [filtered-beaches] Tide Raider missing. Generating on-demand (Background)...`);
      const { EnsembleService } = require("../services/ensembleService");
      EnsembleService.updateEnsembleForecast(regionId, targetDate, timeSlotParam as any).catch((e: any) => {
        console.error(`❌ [filtered-beaches] Background Ensemble generation failed:`, e);
      });
    }

    // Trigger scraping in background
    console.log(
      `[filtered-beaches] 🚨 No forecast found for ${regionId} (${sourceParam}/${timeSlotParam}). Triggering BACKGROUND scrape...`
    );
    
    getLatestConditions(
      regionId,
      false, 
      effectiveSource as any,
      undefined, 
      targetDate,
      timeSlotParam
    ).catch(scrapeError => {
      console.error(`[filtered-beaches] ❌ Background scrape failed:`, scrapeError);
    });
  }

  // Ensure date matches target date
  if (forecast) {
    forecast.date = targetDate;
  }

  // Step 2: Calculate scores only if they don't exist and we have forecast
  if (forecast && !scoreCheck && regionId) {
    try {
      await ScoreService.calculateAndStoreScores(regionId, {
        ...forecast,
        date: targetDate,
        timeSlot: timeSlotParam,
      });
    } catch (error) {
      console.error(`[filtered-beaches] Score calculation failed:`, error);
    }
  }

  // Step 3: Fetch beaches and hidden gem count in parallel
  const dataMappingSource = forecast?.source || ((sourceParam === "WINDFINDER" && diffDays > 3) ? "WINDGURU" : sourceParam);

  const [beaches, hiddenGemCount] = await Promise.all([
    prisma.beach.findMany({
      where: whereClause,
      // MASTER-DETAIL: Select ONLY the fields needed for the list view and cards (including videos)
      select: {
        id: true,
        name: true,
        coordinates: true,
        continent: true,
        regionId: true,
        location: true,
        distanceFromCT: true,
        bestSeasons: true,
        difficulty: true,
        waveType: true,
        image: true,
        profileImage: true,
        isHiddenGem: true,
        sheltered: true,
        countryId: true,
        isLongboarding: true,
        isFoiling: true,
        videos: true, // Keep videos showing in cards!
        region: true,
        conditionProfiles: {
          where: {
            category: "GENERAL"
          }
        },
        intelligenceReports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, createdAt: true }
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
        logEntries: {
          where: { 
            OR: [
              { isPrivate: false, isAnonymous: false },
              { userId: user?.id }
            ]
          },
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            date: true,
            userId: true,
            surferRating: true,
            comments: true,
            imageUrl: true,
            videoUrl: true,
            videoPlatform: true,
            videoUrls: true,
            surferName: true,
            forecast: true,
          }
        }
      }
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
        { score: number; starRating: number; deductions: string[]; checklist: any }
      >,
      beach
    ) => {
      const isPremiumUser = !isGateEnabled || isPremium;
      // Always unlocked per user request
      const isGated = false;
      
      const dailyScore =
        beach.beachDailyScores.length > 0
          ? beach.beachDailyScores[0]
          : null;
      
      acc[beach.id] = {
        score: dailyScore?.score ?? 0,
        starRating: dailyScore?.starRating ?? 0,
        deductions: isGated ? [] : (dailyScore?.conditions as any)?.deductions || [],
        checklist: isGated ? null : (dailyScore?.conditions as any)?.checklist || null,
      };
      return acc;
    },
    {}
  );

  const responseData = {
    beaches: beaches.map((beach) => {
      const { beachDailyScores, conditionProfiles, ...beachData } = beach as any;
      const profile = conditionProfiles?.[0] || {};
      
      const isPremiumUser = !isGateEnabled || isPremium;
      // Always unlocked per user request
      const isGated = false;

      return {
        ...beachData,
        name: isGated ? "Hidden Gem Break" : beachData.name,
        location: isGated ? "Secret Location" : beachData.location,
        optimalWindDirections: profile.optimalWindDirections || [],
        optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
        swellSize: profile.swellSize || { min: 0, max: 10 },
        idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
        optimalTide: profile.optimalTide || "ALL",
        hasAIReport: beach.intelligenceReports.length > 0,
        hasRecentAIReport: beach.intelligenceReports.some((r: any) => 
          new Date(r.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
        ),
        hasFreshIntel: beach.intelligenceReports.some((r: any) => 
          new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ),
      };
    }),
    scores,
    forecast,
    availableDates,
    hiddenGemCount,
    totalCount: beaches.length,
  };

  // Cache both FRESH and STALE keys in parallel
  if (beaches.length > 0 || forecast) {
    await Promise.all([
      cacheApiResponse(`filtered-beaches:fresh:${cacheKey}`, responseData, 300), // Fresh for 5 minutes
      cacheApiResponse(`filtered-beaches:stale:${cacheKey}`, responseData, 86400) // Stale/Back-up for 24 hours
    ]);
  }

  return responseData;
}

router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    console.log("[filtered-beaches] Received request:", req.query);
    try {
      // Create cache key from query params
      const cacheKeyParts = [
        req.query.regionId,
        req.query.date || req.query.forecastDate,
        req.query.timeSlot,
        req.query.source,
        req.query.isHiddenGem,
        req.query.isRegular,
        req.query.isLongboarding,
        req.query.isFoiling,
        req.query.searchQuery,
        (req as any).user?.isSubscribed || (req as any).user?.hasActiveTrial ? "premium" : "free"
      ];
      const cacheKey = crypto.createHash('md5').update(JSON.stringify(cacheKeyParts)).digest('hex');
      
      const regionIdParam = (req.query.regionId as string)?.toLowerCase();
      const searchQuery = req.query.searchQuery
        ? (req.query.searchQuery as string).trim()
        : undefined;
      const sourceParam =
        (req.query.source as "WINDFINDER" | "WINDFINDER_SUPER" | "WINDGURU" | "WINDY" | "TIDE_RAIDER") ||
        "WINDFINDER";
      const mode = req.query.mode as string | undefined;

      // Handle 'markers' mode for ultra-fast initial map load (kept exact as-is)
      if (mode === "markers") {
        const markersCacheKey = `markers:${regionIdParam}:${searchQuery}:${req.query.isHiddenGem}:${req.query.isRegular}`;
        const cachedMarkers = await getCachedApiResponse(markersCacheKey);
        if (cachedMarkers) {
          console.log("[filtered-beaches] 🚀 Serving markers from cache");
          return res.json(typeof cachedMarkers === 'string' ? JSON.parse(cachedMarkers) : cachedMarkers);
        }

        const beaches = await prisma.beach.findMany({
          where: {
            ...(regionIdParam && { regionId: regionIdParam }),
            ...(searchQuery && { name: { contains: searchQuery, mode: 'insensitive' } }),
            ...(req.query.isHiddenGem === "true" ? { isHiddenGem: true } : {}),
            ...(req.query.isRegular === "true" ? { isHiddenGem: false } : {}),
          },
          select: {
            id: true,
            name: true,
            coordinates: true,
            location: true,
            isHiddenGem: true,
            regionId: true,
          }
        });

        const isPremiumUser = (req as any).user?.isSubscribed || (req as any).user?.hasActiveTrial;

        const markerResponse = {
          beaches: beaches.map(b => ({
            ...b,
            name: b.name,
            location: b.location,
          })),
          totalCount: beaches.length,
          mode: "markers"
        };

        await cacheApiResponse(markersCacheKey, markerResponse, 86400); // Cache for 24h
        return res.json(markerResponse);
      }

      // Check FRESH Cache first (Served in under 15ms)
      const cachedFreshResponse = await getCachedApiResponse(`filtered-beaches:fresh:${cacheKey}`);
      if (cachedFreshResponse) {
        console.log("[filtered-beaches] 🚀 Serving from FRESH cache!");
        return res.json(typeof cachedFreshResponse === 'string' ? JSON.parse(cachedFreshResponse) : cachedFreshResponse);
      }

      // Pre-process filters
      const crimeLevelParam = req.query.crimeLevel as string | undefined;
      const crimeLevels = crimeLevelParam
        ? (crimeLevelParam.split(",") as CrimeLevel[])
        : undefined;

      const ignoreRegion = req.query.ignoreRegion === "true";
      let regionId: string | undefined = undefined;

      if (regionIdParam && !ignoreRegion) {
        // Quick resolve to verify region exists (full resolution happens in helper)
        const region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: regionIdParam },
              { name: { equals: regionIdParam, mode: "insensitive" } },
            ]
          }
        });
        if (region) regionId = region.id;
      }

      const whereClause: Prisma.BeachWhereInput = {
        ...(regionId && !ignoreRegion && { regionId }),
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

      const user = (req as any).user;
      const isSubscribed = user?.isSubscribed;
      const hasActiveTrial = user?.hasActiveTrial;
      
      const gateHeader = req.headers['x-gate-enabled'];
      const isGateEnabled = gateHeader !== 'false' && process.env.GATE !== 'false' && process.env.NEXT_PUBLIC_GATE !== 'false';
      const isPremium = !isGateEnabled || isSubscribed || hasActiveTrial;
      
      const showHiddenGems = String(req.query.isHiddenGem) === "true";
      const showRegular = String(req.query.isRegular) === "true" || req.query.isRegular === undefined;

      const typeFilters: Prisma.BeachWhereInput[] = [];

      if (showHiddenGems) {
        typeFilters.push({ isHiddenGem: true });
      }

      if (showRegular) {
        typeFilters.push({ 
          OR: [
            { isHiddenGem: false },
            { isHiddenGem: null }
          ]
        });
      }

      if (typeFilters.length > 0) {
        whereClause.AND = [
          ...(whereClause.AND as any[] || []),
          { OR: typeFilters }
        ];
      } else {
        whereClause.id = "force-zero-results";
      }

      if (req.query.isLongboarding === "true") {
        whereClause.isLongboarding = true;
      }

      const timeSlotParam = (req.query.timeSlot as string) || "MORNING";
      const forecastDateParam = (req.query.forecastDate || req.query.date) as string | undefined;
      let targetDate: Date;

      if (forecastDateParam) {
        const [year, month, day] = forecastDateParam.split("-").map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let effectiveSource = sourceParam;
      if (diffDays < 0) {
        effectiveSource = "OPENMETEO_ARCHIVE" as any;
      } else if (sourceParam === "WINDFINDER" && diffDays > 3) {
        effectiveSource = "WINDGURU";
      }

      // Check STALE Cache (Served immediately while revalidating in background)
      const cachedStaleResponse = await getCachedApiResponse(`filtered-beaches:stale:${cacheKey}`);
      if (cachedStaleResponse) {
        console.log("[filtered-beaches] 🕒 Serving from STALE cache, running background revalidation!");
        
        // Serve stale response immediately (under 15ms)
        res.json(typeof cachedStaleResponse === 'string' ? JSON.parse(cachedStaleResponse) : cachedStaleResponse);

        // Run revalidation non-blocking in background
        fetchFilteredBeachesData(
          regionIdParam,
          searchQuery,
          sourceParam,
          user,
          isPremium,
          isGateEnabled,
          showHiddenGems,
          showRegular,
          timeSlotParam,
          targetDate,
          diffDays,
          effectiveSource,
          whereClause,
          cacheKey
        ).catch((backgroundError) => {
          console.error("❌ [filtered-beaches] Background SWR Revalidation failed:", backgroundError);
        });

        return;
      }

      // Cold start - fetch data synchronously
      console.log("[filtered-beaches] ❄️ Cold start - executing database queries synchronously");
      const freshData = await fetchFilteredBeachesData(
        regionIdParam,
        searchQuery,
        sourceParam,
        user,
        isPremium,
        isGateEnabled,
        showHiddenGems,
        showRegular,
        timeSlotParam,
        targetDate,
        diffDays,
        effectiveSource,
        whereClause,
        cacheKey
      );

      return res.json(freshData);
    } catch (error: any) {
      console.error("API Error:", error);

      if (
        error?.code === "P1001" || 
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
