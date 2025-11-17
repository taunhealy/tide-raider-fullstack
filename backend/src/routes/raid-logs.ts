import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma"; // Still needed for forecast endpoint
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";
import { LogService } from "../services/logService";
import { validate } from "../middleware/validation";
import {
  createRaidLogSchema,
  updateRaidLogSchema,
  deleteRaidLogQuerySchema,
  getRaidLogsQuerySchema,
} from "../validators/logValidators";
import { dataRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// GET /api/raid-logs - List log entries with filters
// Use dataRateLimiter for this frequently called endpoint
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  validate({ query: getRaidLogsQuerySchema }),
  async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    try {
      const {
        id,
        beaches,
        regions,
        regionId: regionIdParam,
        countries,
        minRating,
        maxRating,
        startDate,
        endDate,
        page,
        limit,
        isPrivate: isPrivateParam,
        userId: filterUserId,
        beachId,
      } = req.query;

      // Parse query parameters
      const beachList = beaches
        ? (beaches as string).split(",").filter(Boolean)
        : [];
      const regionList = regions
        ? (regions as string).split(",").filter(Boolean)
        : [];

      const result = await LogService.getLogEntriesWithFilters(
        {
          id: id as string | undefined,
          beaches: beachList,
          regions: regionList,
          regionId: regionIdParam as string | undefined,
          countries: countries
            ? (countries as string).split(",").filter(Boolean)
            : undefined,
          minRating: minRating as number | undefined,
          maxRating: maxRating as number | undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
          page: page as number | undefined,
          limit: limit as number | undefined,
          isPrivate: isPrivateParam as boolean | undefined,
          userId: filterUserId as string | undefined,
          beachId: beachId as string | undefined,
        },
        authReq.user?.id
      );

      // If single entry was requested
      if (result.entry) {
        return res.json(result.entry);
      }

      // Return paginated results
      return res.json({
        entries: result.entries,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      console.error("❌ Error fetching raid logs:", error);
      return res.status(500).json({ error: "Failed to fetch logs" });
    }
  }
);

// POST /api/raid-logs - Create a new log entry
router.post(
  "/",
  authenticateToken,
  validate({ body: createRaidLogSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as unknown as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const logEntry = await LogService.createRaidLogEntry(
        authReq.user.id,
        req.body
      );

      return res.json(logEntry);
    } catch (error) {
      console.error("Error creating log entry:", error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create log entry",
      });
    }
  }
);

// PUT /api/raid-logs - Update a log entry
router.put(
  "/",
  authenticateToken,
  validate({ body: updateRaidLogSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as unknown as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Log entry ID is required" });
      }

      const logEntry = await LogService.updateLogEntry(
        id,
        authReq.user.id,
        updateData
      );

      return res.json(logEntry);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error updating log entry:", error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update log entry",
      });
    }
  }
);

// DELETE /api/raid-logs - Delete a log entry
router.delete(
  "/",
  authenticateToken,
  validate({ query: deleteRaidLogQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as unknown as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.query;

      await LogService.deleteLogEntry(id as string, authReq.user.id);

      return res.json({ message: "Log entry deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error deleting log entry:", error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete log entry",
      });
    }
  }
);

// GET /api/raid-logs/forecast - Get forecast for a region and date
router.get("/forecast", async (req: Request, res: Response) => {
  try {
    const { region, date } = req.query;

    if (!region || !date) {
      return res.status(400).json({ error: "Missing region or date" });
    }

    const dateOnly = new Date(date as string).toISOString().split("T")[0];
    const forecast = await prisma.forecastA.findFirst({
      where: {
        date: new Date(dateOnly),
        regionId: region as string,
      },
    });

    if (!forecast) {
      const createdForecast = await prisma.forecastA.create({
        data: {
          date: new Date(dateOnly),
          regionId: region as string,
        },
      });
      return res.json(createdForecast);
    }

    return res.json(forecast);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return res.status(500).json({ error: "Failed to fetch forecast" });
  }
});

// GET /api/raid-logs/user/:userId - Get user's log entries
router.get(
  "/user/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as unknown as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { userId } = req.params;

      const entries = await LogService.getUserLogEntries(authReq.user.id);
      return res.json(entries);
    } catch (error) {
      console.error("Error fetching user logs:", error);
      return res.status(500).json({ error: "Failed to fetch logs" });
    }
  }
);

export default router;
