import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";
import { HiddenGemStatus } from "@prisma/client";

const router = Router();

// GET /api/hidden-gems?regionId=xxx&status=APPROVED
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const regionIdParam = (req.query.regionId as string)?.toLowerCase();
      const status = (req.query.status as HiddenGemStatus) || "APPROVED";

      // Build where clause
      const whereClause: any = {
        status, // Only show approved by default
      };

      if (regionIdParam) {
        // Try to find region
        const region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: regionIdParam },
              { name: { equals: regionIdParam, mode: "insensitive" } },
            ],
          },
        });

        if (region) {
          whereClause.regionId = region.id;
        }
      }

      // Fetch hidden gems
      const hiddenGems = await prisma.hiddenGem.findMany({
        where: whereClause,
        include: {
          region: {
            include: {
              country: {
                include: {
                  continent: true,
                },
              },
            },
          },
          submittedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          logEntries: {
            take: 10,
            orderBy: {
              date: "desc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        hiddenGems,
        totalCount: hiddenGems.length,
      });
    } catch (error: any) {
      console.error("API Error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch hidden gems" });
    }
  }
);

// GET /api/hidden-gems/:id
router.get(
  "/:id",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const hiddenGem = await prisma.hiddenGem.findUnique({
        where: { id },
        include: {
          region: {
            include: {
              country: {
                include: {
                  continent: true,
                },
              },
            },
          },
          submittedBy: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
            },
          },
          logEntries: {
            orderBy: {
              date: "desc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!hiddenGem) {
        return res.status(404).json({ error: "Hidden gem not found" });
      }

      // Increment view count
      await prisma.hiddenGem.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return res.json(hiddenGem);
    } catch (error: any) {
      console.error("API Error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch hidden gem" });
    }
  }
);

// POST /api/hidden-gems
router.post(
  "/",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const {
        name,
        description,
        location,
        regionId,
        countryId,
        continent,
        coordinates,
        waveType,
        difficulty,
        optimalTide,
        bestSeasons,
        optimalWindDirections,
        optimalSwellDirections,
        swellSize,
        idealSwellPeriod,
        hazards,
        crimeLevel,
        sharkRisk,
        sheltered,
        crowdLevel,
        images,
        videos,
        status,
      } = req.body;

      // Validate required fields
      if (!name || !description || !location || !regionId || !countryId || !continent || !coordinates) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create hidden gem
      const hiddenGem = await prisma.hiddenGem.create({
        data: {
          name,
          description,
          location,
          regionId,
          countryId,
          continent,
          coordinates,
          waveType,
          difficulty,
          optimalTide,
          bestSeasons: bestSeasons || [],
          optimalWindDirections: optimalWindDirections || [],
          optimalSwellDirections,
          swellSize,
          idealSwellPeriod,
          hazards: hazards || [],
          crimeLevel,
          sharkRisk,
          sheltered: sheltered || false,
          crowdLevel,
          images: images || [],
          videos,
          submittedById: userId,
          status: status || "PENDING",
        },
        include: {
          region: true,
          submittedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return res.status(201).json(hiddenGem);
    } catch (error: any) {
      console.error("API Error:", error);
      return res
        .status(500)
        .json({ error: "Failed to create hidden gem" });
    }
  }
);

export default router;
