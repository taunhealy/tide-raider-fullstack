import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Validation schema
const logEntrySchema = z.object({
  beachName: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  surferName: z.string(),
  surferEmail: z.string(),
  surferRating: z.number().min(0).max(5),
  comments: z.string().optional(),
  imageUrl: z.string().optional(),
  isPrivate: z.boolean().optional(),
  forecast: z.object({
    wind: z.object({
      speed: z.number(),
      direction: z.string(),
    }),
    swell: z.object({
      height: z.number(),
      period: z.number(),
      direction: z.string(),
      cardinalDirection: z.string().optional(),
    }),
    timestamp: z.number(),
  }),
  continent: z.string(),
  country: z.string(),
  regionId: z.string(),
  waveType: z.string(),
  isAnonymous: z.boolean().optional(),
  userId: z.string().optional(),
});

// GET /api/raid-logs - List log entries with filters
router.get("/", optionalAuth, async (req: Request, res: Response) => {
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

    // If an ID is provided, fetch a single log entry
    if (id) {
      try {
        const entry = await prisma.logEntry.findUnique({
          where: { id: id as string },
          select: {
            id: true,
            date: true,
            surferName: true,
            surferEmail: true,
            surferRating: true,
            comments: true,
            isPrivate: true,
            isAnonymous: true,
            waveType: true,
            imageUrl: true,
            videoUrl: true,
            videoPlatform: true,
            userId: true,
            beachName: true,
            beachId: true,
            regionId: true,
            region: {
              select: {
                id: true,
                name: true,
                continent: true,
                country: true,
              },
            },
            beach: {
              select: {
                id: true,
                name: true,
                region: {
                  select: {
                    id: true,
                    name: true,
                    country: true,
                    continent: true,
                  },
                },
                waveType: true,
                difficulty: true,
              },
            },
            forecast: {
              select: {
                id: true,
                date: true,
                windSpeed: true,
                windDirection: true,
                swellHeight: true,
                swellPeriod: true,
                swellDirection: true,
              },
            },
            user: {
              select: {
                id: true,
                nationality: true,
                name: true,
              },
            },
            alerts: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        });

        if (!entry) {
          return res.status(404).json({ error: "Log entry not found" });
        }

        if (entry.isPrivate) {
          if (!authReq.user?.id || entry.userId !== authReq.user.id) {
            return res.status(403).json({
              error: "Unauthorized to view this private entry",
            });
          }
        }

        return res.json(entry);
      } catch (error) {
        console.error("Failed to fetch log entry:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // Handle list query
    const beachList = beaches
      ? (beaches as string).split(",").filter(Boolean)
      : [];
    let regionList = regions
      ? (regions as string).split(",").filter(Boolean)
      : [];
    const countryList = countries
      ? (countries as string).split(",").filter(Boolean)
      : [];
    const minRatingNum = Number(minRating) || 0;
    const maxRatingNum = Number(maxRating) || 5;
    const startDateStr = startDate as string | undefined;
    const endDateStr = endDate as string | undefined;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const isPrivate = isPrivateParam === "true";
    const filterUserIdStr = filterUserId as string | undefined;
    const beachIdStr = beachId as string | undefined;

    // Handle regionId parameter
    if (regionIdParam && regionList.length === 0) {
      try {
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            regionIdParam as string
          );

        if (isUUID) {
          regionList = [regionIdParam as string];
        } else {
          const region = await prisma.region.findFirst({
            where: {
              OR: [
                { id: regionIdParam as string },
                {
                  name: {
                    contains: regionIdParam as string,
                    mode: "insensitive",
                  },
                },
              ],
            },
            select: { id: true },
          });

          if (region) {
            regionList = [region.id];
          } else {
            return res.json({
              entries: [],
              total: 0,
              page: 1,
              limit: 50,
              totalPages: 0,
            });
          }
        }
      } catch (error) {
        console.error("Error resolving regionId:", error);
        return res.json({
          entries: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        });
      }
    }

    // Build where clause
    let whereClause: any = {};

    if (filterUserIdStr) {
      whereClause.userId = filterUserIdStr;

      if (!authReq.user?.id || authReq.user.id !== filterUserIdStr) {
        whereClause.isPrivate = false;
        whereClause.isAnonymous = false;
      }
    } else {
      if (authReq.user?.id) {
        whereClause.OR = [
          { isPrivate: false, isAnonymous: false },
          { userId: authReq.user.id },
        ];
      } else {
        whereClause.isPrivate = false;
        whereClause.isAnonymous = false;
      }

      if (isPrivate && authReq.user?.id) {
        whereClause = {
          isPrivate: true,
          userId: authReq.user.id,
        };
      }
    }

    if (beachIdStr) {
      whereClause.beachId = beachIdStr;
    } else if (beachList.length > 0) {
      whereClause.beachId = { in: beachList };
    }
    if (regionList.length > 0) whereClause.regionId = { in: regionList };
    if (minRatingNum > 0) whereClause.surferRating = { gte: minRatingNum };
    if (maxRatingNum < 5) {
      whereClause.surferRating = {
        ...(whereClause.surferRating || {}),
        lte: maxRatingNum,
      };
    }

    if (startDateStr) {
      whereClause.date = {
        ...(whereClause.date || {}),
        gte: new Date(startDateStr),
      };
    }

    if (endDateStr) {
      const endDateObj = new Date(endDateStr);
      endDateObj.setDate(endDateObj.getDate() + 1);
      whereClause.date = { ...(whereClause.date || {}), lt: endDateObj };
    }

    // Clean where clause
    const cleanedWhereClause: any = {};
    for (const [key, value] of Object.entries(whereClause)) {
      if (value !== undefined && value !== null) {
        const valueObj = value as any;
        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          (valueObj.in ||
            valueObj.OR ||
            valueObj.gte ||
            valueObj.lte ||
            valueObj.lt ||
            valueObj.gt)
        ) {
          cleanedWhereClause[key] = value;
        } else if (typeof value !== "object" || Array.isArray(value)) {
          cleanedWhereClause[key] = value;
        }
      }
    }

    const [logEntries, total] = await Promise.all([
      prisma.logEntry.findMany({
        where: cleanedWhereClause,
        orderBy: { date: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          date: true,
          surferName: true,
          surferEmail: true,
          surferRating: true,
          comments: true,
          isPrivate: true,
          isAnonymous: true,
          waveType: true,
          imageUrl: true,
          videoUrl: true,
          videoPlatform: true,
          userId: true,
          region: {
            select: {
              id: true,
              name: true,
              continent: true,
              country: true,
            },
          },
          beach: {
            select: {
              id: true,
              name: true,
              region: {
                select: {
                  id: true,
                  name: true,
                  country: true,
                  continent: true,
                },
              },
              waveType: true,
              difficulty: true,
            },
          },
          forecast: {
            select: {
              id: true,
              date: true,
              windSpeed: true,
              windDirection: true,
              swellHeight: true,
              swellPeriod: true,
              swellDirection: true,
            },
          },
          user: {
            select: {
              id: true,
              nationality: true,
              name: true,
            },
          },
          alerts: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      }),
      prisma.logEntry.count({ where: cleanedWhereClause }),
    ]);

    const enhancedEntries = logEntries.map((entry) => ({
      ...entry,
      hasAlert: entry.alerts.length > 0,
      alertId: entry.alerts[0]?.id || null,
      isMyAlert: entry.alerts.some(
        (alert) => alert.userId === authReq.user?.id
      ),
    }));

    return res.json({
      entries: enhancedEntries,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("❌ Error fetching raid logs:", error);
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// POST /api/raid-logs - Create a new log entry
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const data = req.body;

    const [beach, region] = await Promise.all([
      prisma.beach.findFirst({
        where: {
          OR: [{ id: data.beachId }, { name: data.beachName }],
        },
      }),
      prisma.region.findUnique({
        where: { id: data.regionId },
      }),
    ]);

    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    const forecast = data.forecastId
      ? await prisma.forecastA.findUnique({
          where: { id: data.forecastId },
        })
      : await prisma.forecastA.findFirst({
          where: {
            regionId: region.id,
            date: {
              gte: new Date(new Date(data.date).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(data.date).setHours(23, 59, 59, 999)),
            },
          },
        });

    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date(data.date),
        surferName: data.surferName,
        surferEmail: data.surferEmail,
        beachName: data.beachName,
        surferRating: data.surferRating,
        comments: data.comments,
        isPrivate: data.isPrivate ?? false,
        isAnonymous: data.isAnonymous ?? false,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        videoPlatform: data.videoPlatform,
        waveType: data.waveType,
        user: {
          connect: { id: authReq.user.id },
        },
        region: {
          connect: { id: region.id },
        },
        ...(beach && {
          beach: {
            connect: { id: beach.id },
          },
        }),
        ...(forecast && {
          forecast: {
            connect: { id: forecast.id },
          },
        }),
      },
      include: {
        beach: true,
        region: true,
        forecast: true,
        user: {
          select: {
            id: true,
            name: true,
            nationality: true,
          },
        },
        alerts: true,
      },
    });

    return res.json(logEntry);
  } catch (error) {
    console.error("Error creating log entry:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to create log entry",
    });
  }
});

// PUT /api/raid-logs - Update a log entry
router.put("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = req.body;
    const { id, ...updateData } = data;

    if (!id) {
      return res.status(400).json({ message: "Log entry ID is required" });
    }

    const existingEntry = await prisma.logEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingEntry) {
      return res.status(404).json({ message: "Log entry not found" });
    }

    if (existingEntry.userId !== authReq.user.id) {
      return res.status(403).json({
        message: "Unauthorized to update this log entry",
      });
    }

    let beach = null;
    let region = null;

    if (updateData.beachId || updateData.beachName) {
      beach = await prisma.beach.findFirst({
        where: {
          OR: [
            { id: updateData.beachId },
            { name: updateData.beachName },
          ].filter(Boolean),
        },
      });
    }

    if (updateData.regionId) {
      region = await prisma.region.findUnique({
        where: { id: updateData.regionId },
      });
    }

    let forecast = null;
    if (updateData.forecastId) {
      forecast = await prisma.forecastA.findUnique({
        where: { id: updateData.forecastId },
      });
    } else if (updateData.date && region) {
      forecast = await prisma.forecastA.findFirst({
        where: {
          regionId: region.id,
          date: {
            gte: new Date(new Date(updateData.date).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(updateData.date).setHours(23, 59, 59, 999)),
          },
        },
      });
    }

    const updatePayload: any = {
      ...(updateData.date && { date: new Date(updateData.date) }),
      ...(updateData.surferName && { surferName: updateData.surferName }),
      ...(updateData.surferEmail && { surferEmail: updateData.surferEmail }),
      ...(updateData.beachName && { beachName: updateData.beachName }),
      ...(typeof updateData.surferRating === "number" && {
        surferRating: updateData.surferRating,
      }),
      ...(updateData.comments !== undefined && {
        comments: updateData.comments,
      }),
      ...(typeof updateData.isPrivate === "boolean" && {
        isPrivate: updateData.isPrivate,
      }),
      ...(typeof updateData.isAnonymous === "boolean" && {
        isAnonymous: updateData.isAnonymous,
      }),
      ...(updateData.imageUrl !== undefined && {
        imageUrl: updateData.imageUrl,
      }),
      ...(updateData.videoUrl !== undefined && {
        videoUrl: updateData.videoUrl,
      }),
      ...(updateData.videoPlatform !== undefined && {
        videoPlatform: updateData.videoPlatform,
      }),
      ...(updateData.waveType && { waveType: updateData.waveType }),
    };

    if (beach) {
      updatePayload.beach = { connect: { id: beach.id } };
    }
    if (region) {
      updatePayload.region = { connect: { id: region.id } };
    }
    if (forecast) {
      updatePayload.forecast = { connect: { id: forecast.id } };
    }

    const logEntry = await prisma.logEntry.update({
      where: { id },
      data: updatePayload,
      include: {
        beach: true,
        region: true,
        forecast: true,
        user: {
          select: {
            id: true,
            name: true,
            nationality: true,
          },
        },
        alerts: true,
      },
    });

    return res.json(logEntry);
  } catch (error) {
    console.error("Error updating log entry:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to update log entry",
    });
  }
});

// DELETE /api/raid-logs - Delete a log entry
router.delete("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "No ID provided" });
    }

    const logEntry = await prisma.logEntry.findUnique({
      where: { id: id as string },
      select: { userId: true },
    });

    if (!logEntry) {
      return res.status(404).json({ message: "Log entry not found" });
    }

    if (logEntry.userId !== authReq.user.id) {
      return res.status(403).json({
        message: "Unauthorized to delete this log entry",
      });
    }

    await prisma.logEntry.delete({
      where: { id: id as string },
    });

    return res.json({ message: "Log entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting log entry:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to delete log entry",
    });
  }
});

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

      const entries = await prisma.logEntry.findMany({
        where: {
          userId: authReq.user.id,
        },
        include: {
          forecast: true,
        },
        orderBy: { date: "desc" },
      });

      const transformedEntries = entries.map((entry) => {
        const forecast = entry.forecast as any;
        return {
          ...entry,
          forecast: forecast
            ? {
                entries: [
                  {
                    wind: forecast.entries?.[0]?.wind || null,
                    swell: forecast.entries?.[0]?.swell || null,
                    timestamp: forecast.entries?.[0]?.timestamp || null,
                  },
                ],
              }
            : null,
          date: entry.date.toISOString().split("T")[0],
        };
      });

      return res.json(transformedEntries);
    } catch (error) {
      console.error("Error fetching user logs:", error);
      return res.status(500).json({ error: "Failed to fetch logs" });
    }
  }
);

export default router;
