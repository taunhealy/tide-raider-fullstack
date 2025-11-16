import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";

const router = Router();

// GET /api/regions - Get all regions
router.get("/", optionalAuth, async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching regions:", error);
    return res.status(500).json({ error: "Failed to fetch regions" });
  }
});

export default router;
