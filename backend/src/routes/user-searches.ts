import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * GET /api/user-searches?limit=5
 * Get recent user searches
 */
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    const limit = parseInt((req.query.limit as string) || "5");

    // Get recent searches, either for the user or globally
    const searches = await prisma.userSearch.findMany({
      where: authReq.user?.id ? { userId: authReq.user.id } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      distinct: ["regionId"], // Avoid duplicates
      include: {
        region: {
          include: {
            country: true,
          },
        },
      },
    });

    return res.json(searches);
  } catch (error) {
    console.error("[user-searches] Error fetching searches:", error);
    // Return empty array instead of error - search tracking is not critical
    return res.json([]);
  }
});

/**
 * POST /api/user-searches
 * Track a new user search
 */
router.post("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    const { regionId } = req.body;

    if (!regionId) {
      return res.status(400).json({ error: "regionId is required" });
    }

    const search = await prisma.userSearch.create({
      data: {
        regionId,
        userId: authReq.user?.id || null, // Will be null for non-authenticated users
      },
      include: {
        region: {
          include: {
            country: true,
          },
        },
      },
    });

    return res.json(search);
  } catch (error) {
    console.error("[user-searches] Error creating search:", error);
    // Silently fail - search tracking is not critical
    return res.json({ success: false });
  }
});

export default router;

