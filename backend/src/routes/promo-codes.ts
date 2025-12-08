import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// Admin userId - only this user can access promo code management
const ADMIN_USER_ID = "cmiaglun10000s60endrcn5en";

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: () => void) => {
  const authReq = req as AuthRequest;
  if (!authReq.user?.id || authReq.user.id !== ADMIN_USER_ID) {
    return res.status(403).json({ error: "Forbidden", message: "Access denied" });
  }
  next();
};

// GET /api/promo-codes - Get all promo codes
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const promoCodes = await prisma.promoCode.findMany({
        include: {
          _count: {
            select: {
              usages: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({ promoCodes });
    } catch (error) {
      console.error("[promo-codes] Error fetching promo codes:", error);
      return res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  }
);

// GET /api/promo-codes/:id - Get a specific promo code
router.get(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({
        where: { id },
        include: {
          usages: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              usedAt: "desc",
            },
          },
          _count: {
            select: {
              usages: true,
            },
          },
        },
      });

      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }

      return res.json({ promoCode });
    } catch (error) {
      console.error("[promo-codes] Error fetching promo code:", error);
      return res.status(500).json({ error: "Failed to fetch promo code" });
    }
  }
);

// POST /api/promo-codes - Create a new promo code
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { code, description, maxUses, trialDays, isActive } = req.body;

      if (!code || typeof code !== "string") {
        return res.status(400).json({
          error: "Invalid request",
          message: "Code is required",
        });
      }

      // Check if code already exists
      const existing = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase().trim() },
      });

      if (existing) {
        return res.status(400).json({
          error: "Code already exists",
          message: "A promo code with this code already exists",
        });
      }

      const promoCode = await prisma.promoCode.create({
        data: {
          code: code.toUpperCase().trim(),
          description: description || null,
          maxUses: maxUses || null,
          trialDays: trialDays || 30,
          isActive: isActive !== false,
          usedCount: 0,
        },
      });

      return res.status(201).json({ promoCode });
    } catch (error) {
      console.error("[promo-codes] Error creating promo code:", error);
      return res.status(500).json({ error: "Failed to create promo code" });
    }
  }
);

// PUT /api/promo-codes/:id - Update a promo code
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { code, description, maxUses, trialDays, isActive } = req.body;

      // Check if promo code exists
      const existing = await prisma.promoCode.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: "Promo code not found" });
      }

      // If code is being changed, check if new code already exists
      if (code && code.toUpperCase().trim() !== existing.code) {
        const codeExists = await prisma.promoCode.findUnique({
          where: { code: code.toUpperCase().trim() },
        });

        if (codeExists) {
          return res.status(400).json({
            error: "Code already exists",
            message: "A promo code with this code already exists",
          });
        }
      }

      const promoCode = await prisma.promoCode.update({
        where: { id },
        data: {
          ...(code && { code: code.toUpperCase().trim() }),
          ...(description !== undefined && { description }),
          ...(maxUses !== undefined && { maxUses: maxUses || null }),
          ...(trialDays !== undefined && { trialDays }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return res.json({ promoCode });
    } catch (error) {
      console.error("[promo-codes] Error updating promo code:", error);
      return res.status(500).json({ error: "Failed to update promo code" });
    }
  }
);

// DELETE /api/promo-codes/:id - Delete a promo code
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({
        where: { id },
      });

      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }

      await prisma.promoCode.delete({
        where: { id },
      });

      return res.json({ success: true, message: "Promo code deleted" });
    } catch (error) {
      console.error("[promo-codes] Error deleting promo code:", error);
      return res.status(500).json({ error: "Failed to delete promo code" });
    }
  }
);

export default router;

