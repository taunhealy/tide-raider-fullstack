import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, AuthRequest } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";
import { redis } from "../lib/redis";
import crypto from "crypto";
import { ensureRegionDataFresh } from "../services/regionDataService";

const router = Router();

// GET /api/beaches
// Use dataRateLimiter for this frequently called endpoint
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const regionId = req.query.regionId as string | undefined;

      // Check cache for global beach list (no regionId)
      const cacheKey = `beaches:list:${regionId || 'all'}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[beaches] 🚀 Serving from cache: ${cacheKey}`);
        return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }

      const beaches = await prisma.beach.findMany({
        where: regionId
          ? {
              regionId: regionId,
            }
          : undefined,
        include: {
          conditionProfiles: {
            where: { category: "GENERAL" }
          },
          sourceAccuracy: true
        },
      });

      // Synchronize data for the requested region if it's stale (Pulse Strategy)
      if (regionId) {
        ensureRegionDataFresh(regionId).catch(err => {
          console.error(`[beaches] Failed to trigger pulse for ${regionId}:`, err);
        });
      }

      const beachesWithProfiles = beaches.map(beach => {
        const { conditionProfiles, ...beachData } = beach as any;
        const profile = conditionProfiles?.[0] || {};
        return {
          ...beachData,
          optimalWindDirections: profile.optimalWindDirections || [],
          optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
          swellSize: profile.swellSize || { min: 0, max: 10 },
          idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
          optimalTide: profile.optimalTide || "ALL",
          mostAccurateSource: beach.sourceAccuracy?.sort((a: any, b: any) => b.voteCount - a.voteCount)[0]?.source || null,
          sourceAccuracyCount: beach.sourceAccuracy?.reduce((sum: number, s: any) => sum + s.voteCount, 0) || 0,
        };
      });

      // Sort to prioritize Western Cape
      const sortedBeaches = beachesWithProfiles.sort((a, b) => {
        if (a.regionId === 'western-cape' && b.regionId !== 'western-cape') return -1;
        if (a.regionId !== 'western-cape' && b.regionId === 'western-cape') return 1;
        return 0;
      });

      const responseData = { beaches: sortedBeaches };
      
      // Cache for 1 hour
      await redis.set(cacheKey, JSON.stringify(responseData), { ex: 3600 });

      res.json(responseData);
    } catch (error: any) {
      console.error("Failed to fetch beaches:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        name: error?.name,
      });
      
      // If database connection error, return empty array instead of 500
      if (
        error?.code === "P1001" || // Can't reach database server
        error?.name === "PrismaClientInitializationError" ||
        error?.message?.includes("Can't reach database server")
      ) {
        console.warn("[beaches] Database unavailable, returning empty array");
        return res.json({ beaches: [] });
      }
      
      res.status(500).json({ 
        error: "Failed to fetch beaches",
        details: error?.message || "Unknown error"
      });
    }
  }
);

// GET /api/beaches/search?term=xxx&regionId=xxx
// Search beaches by name or location
// IMPORTANT: This route must be defined BEFORE /:name to avoid route conflicts
router.get("/search", dataRateLimiter, async (req: Request, res: Response) => {
  try {
    console.log(
      "[beaches/search] Route hit - term:",
      req.query.term,
      "regionId:",
      req.query.regionId
    );
    const term = req.query.term as string | undefined;
    const regionId = req.query.regionId as string | undefined;

    if (!term || term.trim().length < 2) {
      console.log("[beaches/search] Term too short, returning empty array");
      return res.json([]);
    }

    const sanitizedTerm = term.trim().slice(0, 100);
    const termWithoutSpaces = sanitizedTerm.replace(/\s+/g, "");

    // Use raw SQL for space-agnostic matching (e.g. "Innerkom" matches "Inner Kom")
    // We fetch IDs first, then use Prisma for the full include/relation logic
    const matchingBeaches = regionId 
      ? await prisma.$queryRaw<any[]>`
          SELECT id FROM "Beach"
          WHERE (REPLACE(name, ' ', '') ILIKE ${'%' + termWithoutSpaces + '%'}
          OR name ILIKE ${'%' + sanitizedTerm + '%'}
          OR location ILIKE ${'%' + sanitizedTerm + '%'})
          AND "regionId" = ${regionId}
          LIMIT 20
        `
      : await prisma.$queryRaw<any[]>`
          SELECT id FROM "Beach"
          WHERE REPLACE(name, ' ', '') ILIKE ${'%' + termWithoutSpaces + '%'}
          OR name ILIKE ${'%' + sanitizedTerm + '%'}
          OR location ILIKE ${'%' + sanitizedTerm + '%'}
          LIMIT 20
        `;

    const matchingIds = matchingBeaches.map(b => b.id);

    if (matchingIds.length === 0) {
      return res.json([]);
    }

    // Fetch full beach objects with relations
    const beaches = await prisma.beach.findMany({
      where: {
        id: { in: matchingIds }
      },
      include: {
        conditionProfiles: {
          where: { category: "GENERAL" }
        },
        sourceAccuracy: true
      }
    });

    const beachesWithProfiles = beaches.map(beach => {
      const { conditionProfiles, ...beachData } = beach as any;
      const profile = conditionProfiles?.[0] || {};
      
      const user = (req as any).user;
      const isSubscribed = user?.isSubscribed;
      const hasActiveTrial = user?.hasActiveTrial;
      const isPremium = isSubscribed || hasActiveTrial;
      
      const isGated = beach.isHiddenGem && !isPremium;

      return {
        ...beachData,
        optimalWindDirections: profile.optimalWindDirections || [],
        optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
        swellSize: profile.swellSize || { min: 0, max: 10 },
        idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
        optimalTide: profile.optimalTide || "ALL",
        mostAccurateSource: beach.sourceAccuracy?.sort((a: any, b: any) => b.voteCount - a.voteCount)[0]?.source || null,
        sourceAccuracyCount: beach.sourceAccuracy?.reduce((sum: number, s: any) => sum + s.voteCount, 0) || 0,
        // Gate sensitive data
        ...(isGated && {
          description: "Locked Hidden Gem - Subscribe to unlock full details.",
          hazards: [],
          videos: [],
          coffeeShop: [],
        })
      };
    });

    // Sort results to prioritize the requested region and then by name
    const sortedResults = beachesWithProfiles.sort((a, b) => {
      if (regionId) {
        if (a.regionId === regionId && b.regionId !== regionId) return -1;
        if (a.regionId !== regionId && b.regionId === regionId) return 1;
      }
      return a.name.localeCompare(b.name);
    }).slice(0, 10);

    console.log(`[beaches/search] Returning ${sortedResults.length} results`);
    return res.json(sortedResults);
  } catch (error) {
    console.error("[beaches/search] Unexpected error:", error);
    return res.json([]);
  }
});

// GET /api/beaches/:name
// Supports both UUID (ID) and name lookups
router.get("/:name", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);

    // Check if it's a UUID (36 characters with dashes)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedName
      );

    let beach = null;

    const commonIncludes = {
      region: true,
      conditionProfiles: {
        where: { category: "GENERAL" }
      },
      sourceAccuracy: true
    };

    if (isUUID) {
      // Try to find by ID first
      beach = await prisma.beach.findUnique({
        where: { id: decodedName },
        include: commonIncludes,
      });
    }

    // If not found by ID, try by name
    if (!beach) {
      beach = await prisma.beach.findFirst({
        where: { name: decodedName },
        include: commonIncludes,
      });
    }

    // If still not found, try case-insensitive name match
    if (!beach) {
      beach = await prisma.beach.findFirst({
        where: {
          name: {
            equals: decodedName,
            mode: "insensitive",
          },
        },
        include: commonIncludes,
      });
    }

    // If still not found, try slug-to-name conversion (hyphens to spaces)
    // This handles cases where frontend sends "pringle-bay" but DB has "Pringle Bay"
    if (!beach && decodedName.includes("-")) {
      const nameWithSpaces = decodedName.replace(/-/g, " ");
      beach = await prisma.beach.findFirst({
        where: {
          name: {
            equals: nameWithSpaces,
            mode: "insensitive",
          },
        },
        include: commonIncludes,
      });
    }

    // If still not found, try partial match (contains)
    if (!beach) {
      beach = await prisma.beach.findFirst({
        where: {
          name: {
            contains: decodedName.replace(/-/g, " "),
            mode: "insensitive",
          },
        },
        include: commonIncludes,
      });
    }

    if (!beach) {
      return res.status(404).json({ error: "Beach not found" });
    }

    const { conditionProfiles, ...beachData } = beach as any;
    const profile = conditionProfiles?.[0] || {};
    
    const user = (req as any).user;
    const isSubscribed = user?.isSubscribed;
    const hasActiveTrial = user?.hasActiveTrial;
    const isPremium = isSubscribed || hasActiveTrial;
    
    const isGated = beach.isHiddenGem && !isPremium;

    const mappedBeach = {
      ...beachData,
      optimalWindDirections: profile.optimalWindDirections || [],
      optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
      swellSize: profile.swellSize || { min: 0, max: 10 },
      idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
      optimalTide: profile.optimalTide || "ALL",
      mostAccurateSource: beach.sourceAccuracy?.sort((a: any, b: any) => b.voteCount - a.voteCount)[0]?.source || null,
      sourceAccuracyCount: beach.sourceAccuracy?.reduce((sum: number, s: any) => sum + s.voteCount, 0) || 0,
      // Gate sensitive data
      ...(isGated && {
        description: "Locked Hidden Gem - Subscribe to unlock full details and surf reports.",
        hazards: [],
        videos: [],
        coffeeShop: [],
      })
    };

    res.json({ beach: mappedBeach });
  } catch (error) {
    console.error("Failed to fetch beach:", error);
    res.status(500).json({ error: "Failed to fetch beach" });
  }
});

// GET /api/beaches/:id/rating?date=2024-04-18
// Simplified endpoint for live dashboards
router.get("/:id/rating", dataRateLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dateParam = req.query.date as string || new Date().toISOString().split('T')[0];
    const source = req.query.source as string || "WINDFINDER";

    const [year, month, day] = dateParam.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const scoreRecord = await prisma.beachDailyScore.findFirst({
      where: {
        beachId: id,
        date: targetDate,
        source: source
      },
      select: { score: true }
    });

    res.json({ 
      beachId: id,
      date: dateParam,
      score: scoreRecord?.score ?? 0 
    });
  } catch (error) {
    console.error("Failed to fetch beach rating:", error);
    res.json({ score: 0 }); // Fail gracefully for dashboard
  }
});

export default router;
