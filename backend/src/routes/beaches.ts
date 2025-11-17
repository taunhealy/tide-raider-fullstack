import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, AuthRequest } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

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

      const beaches = await prisma.beach.findMany({
        where: regionId
          ? {
              regionId: regionId,
            }
          : undefined,
        include: {
          region: true,
        },
      });

      res.json({ beaches });
    } catch (error) {
      console.error("Failed to fetch beaches:", error);
      res.status(500).json({ error: "Failed to fetch beaches" });
    }
  }
);

// GET /api/beaches/search?term=xxx&regionId=xxx
// Search beaches by name or location
router.get("/search", dataRateLimiter, async (req: Request, res: Response) => {
  try {
    const term = req.query.term as string | undefined;
    const regionId = req.query.regionId as string | undefined;

    if (!term || term.trim().length < 2) {
      return res.json([]);
    }

    const sanitizedTerm = term.trim().slice(0, 100);

    const whereClause: any = {
      OR: [
        { name: { contains: sanitizedTerm, mode: "insensitive" } },
        { location: { contains: sanitizedTerm, mode: "insensitive" } },
      ],
    };

    if (regionId) {
      whereClause.regionId = regionId;
    }

    // First search for beaches in the current region
    let regionBeaches: any[] = [];
    if (regionId) {
      try {
        regionBeaches = await prisma.beach.findMany({
          where: { ...whereClause, regionId },
          include: {
            region: true,
            country: true,
          },
          take: 5,
          orderBy: { name: "asc" },
        });
      } catch (regionError) {
        console.error(
          "[beaches/search] Error searching region beaches:",
          regionError
        );
      }
    }

    // If we don't have enough results from the current region, search all regions
    let otherBeaches: any[] = [];
    if (regionBeaches.length < 5) {
      try {
        const allBeaches = await prisma.beach.findMany({
          where: {
            OR: [
              { name: { contains: sanitizedTerm, mode: "insensitive" } },
              { location: { contains: sanitizedTerm, mode: "insensitive" } },
            ],
            ...(regionId && regionBeaches.length > 0
              ? { regionId: { not: regionId } }
              : {}),
          },
          include: {
            region: true,
            country: true,
          },
          take: 10,
          orderBy: { name: "asc" },
        });

        otherBeaches = allBeaches.slice(0, 5 - regionBeaches.length);
      } catch (allBeachesError) {
        console.error(
          "[beaches/search] Error searching all beaches:",
          allBeachesError
        );
      }
    }

    // Combine results, prioritizing the current region
    const combinedResults = [...regionBeaches, ...otherBeaches];

    return res.json(combinedResults);
  } catch (error) {
    console.error("[beaches/search] Unexpected error:", error);
    return res.json([]);
  }
});

// GET /api/beaches/:name
router.get("/:name", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const beach = await prisma.beach.findFirst({
      where: { name },
      include: {
        region: true,
      },
    });

    if (!beach) {
      return res.status(404).json({ error: "Beach not found" });
    }

    res.json({ beach });
  } catch (error) {
    console.error("Failed to fetch beach:", error);
    res.status(500).json({ error: "Failed to fetch beach" });
  }
});

export default router;
