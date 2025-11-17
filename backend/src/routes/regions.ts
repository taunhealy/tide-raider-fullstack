import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// GET /api/regions - Get all regions
// Use dataRateLimiter for this frequently called endpoint
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const regions = await prisma.region.findMany({
        select: {
          id: true,
          name: true,
          countryId: true,
          continent: true,
          country: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.json(regions);
    } catch (error: any) {
      console.error("Error fetching regions:", error);
      
      // If database is unavailable, return empty array instead of 500
      // This allows the frontend to gracefully handle the error
      if (
        error?.code === "P1001" || // Can't reach database server
        error?.name === "PrismaClientInitializationError" ||
        error?.message?.includes("Can't reach database server")
      ) {
        console.warn("[regions] Database unavailable, returning empty array");
        return res.json([]);
      }
      
      return res.status(500).json({ error: "Failed to fetch regions" });
    }
  }
);

export default router;
