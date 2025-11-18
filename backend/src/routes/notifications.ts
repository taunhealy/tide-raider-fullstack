import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, authenticateToken, optionalAuth } from "../middleware/auth";

const router = Router();

// GET /api/notifications - Get all notifications for user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: authReq.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        alertNotification: true,
        ad: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
        adRequest: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
      },
    });

    return res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/count - Get notification count (0 if unauthenticated)
router.get("/count", optionalAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      // If not authenticated, just return 0 to avoid noisy 401s in the frontend
      return res.json({ count: 0 });
    }

    // Count unread notifications from the last 30 days
    const count = await prisma.notification.count({
      where: {
        userId: authReq.user.id,
        read: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return res.json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch notification count" });
  }
});

// POST /api/notifications/read - Mark notifications as read
router.post("/read", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: "Invalid notification IDs" });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: authReq.user.id,
      },
      data: {
        read: true,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify the notification belongs to the user before deleting
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: authReq.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
