import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateToken, optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/comments?entityId=xxx&entityType=xxx
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { entityId, entityType } = req.query;

    if (!entityId || !entityType) {
      return res.status(400).json({ error: "Missing entityId or entityType" });
    }

    const comments = await prisma.comment.findMany({
      where: {
        entityId: entityId as string,
        entityType: entityType as string,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    return res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { text, entityId, entityType } = req.body;

    if (!text || !entityId || !entityType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        entityId,
        entityType,
        userId: authReq.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    return res.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

export default router;

