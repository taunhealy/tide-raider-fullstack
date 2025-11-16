import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";
import { LogService } from "../services/logService";
import { validate } from "../middleware/validation";
import {
  createLogSchema,
  getLogParamsSchema,
} from "../validators/logValidators";

const router = Router();

// GET /api/logs - Fetch user's log entries
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    // Return empty array for unauthenticated users
    if (!authReq.user?.id) {
      return res.json([]);
    }

    const user = await prisma.user.findUnique({
      where: { email: authReq.user.email! },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const logEntries = await LogService.getUserLogs(user.id);
    return res.json(logEntries);
  } catch (error) {
    console.error("Error fetching log entries:", error);
    return res.status(500).json({ error: "Failed to fetch log entries" });
  }
});

// POST /api/logs - Create a new log entry
router.post(
  "/",
  authenticateToken,
  validate({ body: createLogSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const logEntry = await LogService.createLogEntry(
        authReq.user.id,
        req.body
      );
      return res.json(logEntry);
    } catch (error) {
      console.error("Error creating log entry:", error);
      return res.status(500).json({ error: "Failed to create log entry" });
    }
  }
);

// GET /api/logs/:id - Get a specific log entry
router.get(
  "/:id",
  optionalAuth,
  validate({ params: getLogParamsSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { id: logEntryId } = req.params;

      const result = await LogService.getLogEntryById(
        logEntryId,
        authReq.user?.id
      );

      if (!result) {
        return res.status(404).json({ error: "Log entry not found" });
      }

      return res.json({
        ...result.logEntry,
        forecast: result.forecast,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(403).json({
          error: error.message,
        });
      }
      console.error("Error fetching log entry:", error);
      return res.status(500).json({ error: "Failed to fetch log entry" });
    }
  }
);

export default router;
