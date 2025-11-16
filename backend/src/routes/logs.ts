import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

// GET /api/logs - Fetch user's log entries
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Return empty array for unauthenticated users
    if (!req.user?.id) {
      return res.json([]);
    }

    const user = await prisma.user.findUnique({
      where: { email: req.user.email! },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const logEntries = await prisma.logEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      include: {
        forecast: true,
        beach: {
          include: {
            region: {
              include: {
                country: true,
              },
            },
          },
        },
        region: {
          include: {
            country: true,
          },
        },
        alerts: {
          select: {
            id: true,
            properties: true,
            forecastId: true,
          },
        },
      },
    });

    const enhancedLogEntries = logEntries.map((entry) => ({
      ...entry,
      hasAlert: entry.alerts.length > 0,
      alertId: entry.alerts[0]?.id || null,
      forecast: entry.forecast
        ? {
            id: entry.forecast.id,
            windSpeed: entry.forecast.windSpeed,
            windDirection: entry.forecast.windDirection,
            swellHeight: entry.forecast.swellHeight,
            swellPeriod: entry.forecast.swellPeriod,
            swellDirection: entry.forecast.swellDirection,
          }
        : null,
      beach: entry.beach,
      region: entry.region,
    }));

    return res.json(enhancedLogEntries);
  } catch (error) {
    console.error("Error fetching log entries:", error);
    return res.status(500).json({ error: "Failed to fetch log entries" });
  }
});

// POST /api/logs - Create a new log entry
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = req.body;

    const forecast = await prisma.forecastA.upsert({
      where: {
        date_regionId: {
          date: new Date(data.date),
          regionId: data.region,
        },
      },
      create: {
        date: new Date(data.date),
        regionId: data.region,
        windSpeed: data.forecast.windSpeed,
        windDirection: data.forecast.windDirection,
        swellHeight: data.forecast.swellHeight,
        swellPeriod: data.forecast.swellPeriod,
        swellDirection: data.forecast.swellDirection,
      },
      update: {},
    });

    const logEntry = await prisma.logEntry.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId: req.user.id,
        forecastId: forecast.id,
      },
      include: {
        forecast: true,
        alerts: true,
      },
    });

    return res.json(logEntry);
  } catch (error) {
    console.error("Error creating log entry:", error);
    return res.status(500).json({ error: "Failed to create log entry" });
  }
});

// GET /api/logs/:id - Get a specific log entry
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id: logEntryId } = req.params;

    const logEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
    });

    if (!logEntry) {
      return res.status(404).json({ error: "Log entry not found" });
    }

    if (logEntry.isPrivate) {
      if (!req.user?.id || logEntry.userId !== req.user.id) {
        return res.status(403).json({
          error: "You don't have permission to access this log entry",
        });
      }
    }

    const forecastData = await prisma.forecastA.findFirst({
      where: {
        regionId: logEntry.regionId || "",
        date: logEntry.date,
      },
    });

    const result = {
      ...logEntry,
      forecast: forecastData || null,
    };

    return res.json(result);
  } catch (error) {
    console.error("Error fetching log entry:", error);
    return res.status(500).json({ error: "Failed to fetch log entry" });
  }
});

export default router;
