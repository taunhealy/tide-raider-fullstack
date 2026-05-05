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
        credits: true,
        email: true,
        whatsappNumber: true,
        instagram: true,
        _count: {
          select: {
            boards: true,
            stories: true,
            favorites: true,
            logEntries: true,
            intelligenceReports: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hide sensitive fields if not the owner
    const isOwner = (req as any).user?.id === userId;
    if (!isOwner) {
      delete (user as any).email;
      delete (user as any).whatsappNumber;
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

      const { bio, name, link, whatsappNumber, email } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(typeof bio === 'string' && { bio: bio.trim() }),
          ...(typeof name === 'string' && { name: name.trim() }),
          ...(typeof link === 'string' && { link: link.trim() }),
          ...(typeof instagram === 'string' && { instagram: instagram.trim() }),
          ...(typeof whatsappNumber === 'string' && { whatsappNumber: whatsappNumber.trim() }),
          ...(typeof email === 'string' && { email: email.trim() }),
        },
        select: {
          id: true,
          name: true,
          bio: true,
          link: true,
          image: true,
          email: true,
          instagram: true,
          whatsappNumber: true,
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

// POST /api/users/invite-squad - Send email invites
router.post("/invite-squad", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const authReq = req as AuthRequest;
    const { emails, referralLink } = req.body;
    const userId = authReq.user?.id;
    const userName = authReq.user?.name || "A Tide Raider friend";

    if (!emails || !Array.isArray(emails) || !referralLink) {
      return res.status(400).json({ error: "Emails array and referralLink are required" });
    }

    const { sendEmail } = await import("../lib/email");

    const invitePromises = emails.map(email => {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding:30px; border-radius: 16px; border: 1px solid #eee; background-color: #fff;">
          <h2 style="color: #000; margin-bottom: 15px;">Join the Squad! 🌊</h2>
          <p style="color: #333; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
            ${userName} has invited you to join <strong>Tide Raider</strong>—the ultimate maritime intelligence platform for the Western Cape.
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Why join Tide Raider?</p>
            <ul style="color: #475569; font-size: 15px; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;"><strong>Weekly AI Surf Reports:</strong> Deep-dive strategic intelligence on the best windows to hit the water.</li>
              <li style="margin-bottom: 8px;"><strong>Smart Recommendations:</strong> Know exactly where to go based on swell, wind, and tide synergy.</li>
              <li style="margin-bottom: 8px;"><strong>Automated Alerts:</strong> Real-time WhatsApp/Email notifications when your favorite spots are firing.</li>
              <li style="margin-bottom: 0;"><strong>Hidden Gems:</strong> Access regional rankings and non-commercial break metadata.</li>
            </ul>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${referralLink}" style="background-color: #000; color: #fff; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Join the Raid</a>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Tide Raider is a high-fidelity surf alert and AI reporting system built for the dedicated.
          </p>
        </div>
      `;
      return sendEmail(email, `🌊 Join the Squad: ${userName} invited you to Tide Raider`, htmlContent);
    });

    await Promise.all(invitePromises);

    return res.json({ success: true, count: emails.length });
  } catch (error) {
    console.error("Error sending invites:", error);
    return res.status(500).json({ error: "Failed to send invites" });
  }
});

export default router;
