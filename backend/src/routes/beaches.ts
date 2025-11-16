import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/beaches
router.get("/", optionalAuth, async (req: Request, res: Response) => {
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
