import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { z } from "zod";
import { whatsappService } from "../services/whatsappService";

const router = Router();

// Validation schemas
const createSquadSchema = z.object({
  name: z.string().min(1).max(100),
  members: z
    .array(
      z.object({
        phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, {
          message: "Phone number must be in E.164 format (e.g., +1234567890)",
        }),
        name: z.string().optional(),
      })
    )
    .min(1, "At least one member is required"),
});

const updateSquadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  members: z
    .array(
      z.object({
        phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
        name: z.string().optional(),
      })
    )
    .optional(),
});

const createBroadcastSchema = z.object({
  squadId: z.string().uuid(),
  beachId: z.string().optional(),
  beachName: z.string().optional(),
  message: z.string().min(1).max(1000),
  scheduledAt: z.string().datetime(), // ISO 8601 datetime string
});

// GET /api/squads - Get all squads for the authenticated user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const squads = await prisma.squad.findMany({
      where: {
        userId: authReq.user!.id,
      },
      include: {
        members: {
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            broadcasts: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.json({ squads });
  } catch (error) {
    console.error("❌ Error fetching squads:", error);
    return res.status(500).json({ error: "Failed to fetch squads" });
  }
});

// GET /api/squads/:id - Get a specific squad
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { id } = req.params;

    const squad = await prisma.squad.findFirst({
      where: {
        id,
        userId: authReq.user!.id,
      },
      include: {
        members: {
          orderBy: {
            createdAt: "asc",
          },
        },
        broadcasts: {
          orderBy: {
            scheduledAt: "desc",
          },
          include: {
            beach: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!squad) {
      return res.status(404).json({ error: "Squad not found" });
    }

    return res.json({ squad });
  } catch (error) {
    console.error("❌ Error fetching squad:", error);
    return res.status(500).json({ error: "Failed to fetch squad" });
  }
});

// POST /api/squads - Create a new squad
router.post(
  "/",
  authenticateToken,
  validate({ body: createSquadSchema }),
  async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    try {
      const { name, members } = req.body;

      // Create squad with members in a transaction
      const squad = await prisma.squad.create({
        data: {
          name,
          userId: authReq.user!.id,
          members: {
            create: members.map((member: any) => ({
              phoneNumber: member.phoneNumber,
              name: member.name || null,
            })),
          },
        },
        include: {
          members: true,
        },
      });

      return res.status(201).json({ squad });
    } catch (error) {
      console.error("❌ Error creating squad:", error);
      return res.status(500).json({ error: "Failed to create squad" });
    }
  }
);

// PUT /api/squads/:id - Update a squad
router.put(
  "/:id",
  authenticateToken,
  validate({ body: updateSquadSchema }),
  async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    try {
      const { id } = req.params;
      const { name, members } = req.body;

      // Verify squad belongs to user
      const existingSquad = await prisma.squad.findFirst({
        where: {
          id,
          userId: authReq.user!.id,
        },
      });

      if (!existingSquad) {
        return res.status(404).json({ error: "Squad not found" });
      }

      // Update squad and members in a transaction
      const updateData: any = {};
      if (name) updateData.name = name;

      const squad = await prisma.$transaction(async (tx) => {
        // Update squad
        const updatedSquad = await tx.squad.update({
          where: { id },
          data: updateData,
        });

        // Update members if provided
        if (members) {
          // Delete existing members
          await tx.squadMember.deleteMany({
            where: { squadId: id },
          });

          // Create new members
          await tx.squadMember.createMany({
            data: members.map((member: any) => ({
              squadId: id,
              phoneNumber: member.phoneNumber,
              name: member.name || null,
            })),
          });
        }

        // Return updated squad with members
        return await tx.squad.findUnique({
          where: { id },
          include: {
            members: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });
      });

      return res.json({ squad });
    } catch (error) {
      console.error("❌ Error updating squad:", error);
      return res.status(500).json({ error: "Failed to update squad" });
    }
  }
);

// DELETE /api/squads/:id - Delete a squad
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { id } = req.params;

    // Verify squad belongs to user
    const existingSquad = await prisma.squad.findFirst({
      where: {
        id,
        userId: authReq.user!.id,
      },
    });

    if (!existingSquad) {
      return res.status(404).json({ error: "Squad not found" });
    }

    // Delete squad (cascade will delete members and broadcasts)
    await prisma.squad.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting squad:", error);
    return res.status(500).json({ error: "Failed to delete squad" });
  }
});

// POST /api/squads/broadcasts - Create and send a broadcast
router.post(
  "/broadcasts",
  authenticateToken,
  validate({ body: createBroadcastSchema }),
  async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    try {
      const { squadId, beachId, beachName, message, scheduledAt } = req.body;

      // Verify squad belongs to user
      const squad = await prisma.squad.findFirst({
        where: {
          id: squadId,
          userId: authReq.user!.id,
        },
        include: {
          members: true,
        },
      });

      if (!squad) {
        return res.status(404).json({ error: "Squad not found" });
      }

      if (squad.members.length === 0) {
        return res
          .status(400)
          .json({ error: "Squad has no members to broadcast to" });
      }

      // Get beach name if beachId is provided
      let finalBeachName = beachName;
      if (beachId && !beachName) {
        const beach = await prisma.beach.findUnique({
          where: { id: beachId },
          select: { name: true },
        });
        if (beach) {
          finalBeachName = beach.name;
        }
      }

      // Create broadcast record
      const broadcast = await prisma.broadcast.create({
        data: {
          squadId,
          beachId: beachId || null,
          beachName: finalBeachName || null,
          message,
          scheduledAt: new Date(scheduledAt),
          status: "PENDING",
        },
      });

      // Send WhatsApp messages to all squad members
      const phoneNumbers = squad.members.map((m) => m.phoneNumber);
      const sendResult = await whatsappService.sendBulkMessages(
        phoneNumbers,
        message
      );

      // Update broadcast status
      const updatedBroadcast = await prisma.broadcast.update({
        where: { id: broadcast.id },
        data: {
          status: sendResult.failed === 0 ? "SENT" : "FAILED",
          sentAt: new Date(),
        },
      });

      return res.status(201).json({
        broadcast: updatedBroadcast,
        sendResult: {
          success: sendResult.success,
          failed: sendResult.failed,
          total: phoneNumbers.length,
        },
      });
    } catch (error) {
      console.error("❌ Error creating broadcast:", error);
      return res.status(500).json({ error: "Failed to create broadcast" });
    }
  }
);

export default router;



