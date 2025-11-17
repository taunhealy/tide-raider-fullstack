import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { LogService } from "../services/logService";
import { validate } from "../middleware/validation";
import {
  createLogSchema,
  getLogParamsSchema,
} from "../validators/logValidators";

const router = Router();

// GET /api/logs - Fetch user's log entries
// No auth required - returns empty array if not authenticated
router.get("/", async (req: Request, res: Response) => {
  try {
    // Try to get auth token, but don't require it
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.["auth-token"];

    // If no token, return empty array immediately
    if (!token) {
      return res.json([]);
    }

    // Try to verify token, but don't fail if invalid
    try {
      const jwt = require("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return res.json([]);
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded?.id) {
        return res.json([]);
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true },
      });

      if (!user) {
        return res.json([]);
      }

      const logEntries = await LogService.getUserLogs(user.id);
      return res.json(logEntries);
    } catch (authError) {
      // Token invalid or expired - return empty array
      return res.json([]);
    }
  } catch (error) {
    console.error("Error fetching log entries:", error);
    // Return empty array on error instead of 500
    return res.json([]);
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
// No auth required for viewing - returns 404 if not found or private
router.get(
  "/:id",
  validate({ params: getLogParamsSchema }),
  async (req: Request, res: Response) => {
    try {
      const { id: logEntryId } = req.params;

      // Try to get user ID from token, but don't require it
      let userId: string | undefined;
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.substring(7)
          : req.cookies?.["auth-token"];

        if (token) {
          const jwt = require("jsonwebtoken");
          const JWT_SECRET = process.env.JWT_SECRET;
          if (JWT_SECRET) {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            userId = decoded?.id;
          }
        }
      } catch (authError) {
        // Token invalid - continue without userId
      }

      const result = await LogService.getLogEntryById(logEntryId, userId);

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
