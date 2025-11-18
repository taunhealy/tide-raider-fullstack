import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

// GET /api/users/:userId - Public profile (no auth required)
router.get("/:userId", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Add validation for userId format
    if (!userId || !/^[a-z0-9]+$/.test(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        link: true,
        image: true,
        createdAt: true,
        skillLevel: true,
        nationality: true,
        _count: {
          select: {
            boards: true,
            stories: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT /api/users/:userId - Update profile (authenticated)
router.put(
  "/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      // Users can only update their own profile
      if (authReq.user?.id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { bio, name, link } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(bio !== undefined && { bio: bio.trim() }),
          ...(name !== undefined && { name: name.trim() }),
          ...(link !== undefined && { link: link.trim() }),
        },
        select: {
          id: true,
          name: true,
          bio: true,
          link: true,
          image: true,
          email: true,
        },
      });

      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// PUT /api/users/:userId/nationality
router.put(
  "/:userId/nationality",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      if (authReq.user?.id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { nationality } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { nationality },
        select: {
          id: true,
          nationality: true,
        },
      });

      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating nationality:", error);
      return res.status(500).json({ error: "Failed to update nationality" });
    }
  }
);

// PUT /api/users/:userId/roles - Admin only
router.put(
  "/:userId/roles",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      // Only admins can update roles
      const currentUser = await prisma.user.findUnique({
        where: { id: authReq.user?.id },
        select: { roles: true },
      });

      if (!currentUser?.roles.includes("ADMIN" as any)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { roles } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { roles },
        select: {
          id: true,
          roles: true,
        },
      });

      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating roles:", error);
      return res.status(500).json({ error: "Failed to update roles" });
    }
  }
);

// GET /api/users/:userId/filters
router.get(
  "/:userId/filters",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      if (authReq.user?.id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userFilters = await prisma.userFilters.findUnique({
        where: { userId },
      });

      return res.json({ filters: userFilters });
    } catch (error) {
      console.error("Error fetching user filters:", error);
      return res.status(500).json({ error: "Failed to fetch filters" });
    }
  }
);

// PUT /api/users/:userId/filters
router.put(
  "/:userId/filters",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      if (authReq.user?.id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const filters = req.body;

      const userFilters = await prisma.userFilters.upsert({
        where: { userId },
        update: filters,
        create: {
          userId,
          ...filters,
        },
      });

      return res.json({ filters: userFilters });
    } catch (error) {
      console.error("Error updating user filters:", error);
      return res.status(500).json({ error: "Failed to update filters" });
    }
  }
);

export default router;
