import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class LogService {
  /**
   * Get user's log entries
   */
  static async getUserLogs(userId: string) {
    const logEntries = await prisma.logEntry.findMany({
      where: { userId },
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

    return logEntries.map((entry) => ({
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
  }

  /**
   * Get a single log entry by ID
   */
  static async getLogEntryById(
    logEntryId: string,
    userId?: string
  ): Promise<{
    logEntry: any;
    forecast: any;
  } | null> {
    const logEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
    });

    if (!logEntry) {
      return null;
    }

    // Check privacy
    if (logEntry.isPrivate) {
      if (!userId || logEntry.userId !== userId) {
        throw new Error("Unauthorized to view this private entry");
      }
    }

    const forecastData = await prisma.forecast.findFirst({
      where: {
        regionId: logEntry.regionId || "",
        date: logEntry.date,
        source: "WINDFINDER", // Prefer WINDFINDER source
      },
    });

    return {
      logEntry,
      forecast: forecastData || null,
    };
  }

  /**
   * Create a new log entry
   */
  static async createLogEntry(
    userId: string,
    data: {
      date: string | Date;
      region: string;
      forecast: {
        windSpeed: number;
        windDirection: number;
        swellHeight: number;
        swellPeriod: number;
        swellDirection: number;
      };
      [key: string]: any;
    }
  ) {
    // Upsert forecast
    const { randomUUID } = await import("crypto");
    const forecast = await prisma.forecast.upsert({
      where: {
        date_regionId_source: {
          date: new Date(data.date),
          regionId: data.region,
          source: "WINDFINDER", // Default to WINDFINDER
        },
      },
      create: {
        id: randomUUID(),
        date: new Date(data.date),
        regionId: data.region,
        source: "WINDFINDER", // Default to WINDFINDER
        windSpeed: data.forecast.windSpeed,
        windDirection: data.forecast.windDirection,
        swellHeight: data.forecast.swellHeight,
        swellPeriod: data.forecast.swellPeriod,
        swellDirection: data.forecast.swellDirection,
      },
      update: {},
    });

    // Create log entry
    // Extract region and forecast from data and exclude them from the spread
    // (they're not Prisma relations, just plain objects/strings)
    const { region, forecast: forecastData, ...logData } = data;
    const logEntry = await prisma.logEntry.create({
      data: {
        ...logData,
        date: new Date(data.date),
        userId,
        forecastId: forecast.id,
        regionId: region, // Set regionId directly
      },
      include: {
        forecast: true,
        alerts: true,
      },
    });

    return logEntry;
  }

  /**
   * Get log entries with advanced filtering (for raid-logs)
   */
  static async getLogEntriesWithFilters(
    filters: {
      id?: string;
      beaches?: string[];
      regions?: string[];
      regionId?: string;
      countries?: string[];
      minRating?: number;
      maxRating?: number;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      isPrivate?: boolean;
      userId?: string;
      beachId?: string;
    },
    currentUserId?: string
  ) {
    const {
      id,
      beaches,
      regions,
      regionId: regionIdParam,
      minRating,
      maxRating,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      isPrivate: isPrivateParam,
      userId: filterUserId,
      beachId,
    } = filters;

    // If an ID is provided, fetch a single log entry
    if (id) {
      const entry = await prisma.logEntry.findUnique({
        where: { id },
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
          imageUrls: true, // Include imageUrls array for multiple images
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
        return {
          entry: null,
          entries: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        };
      }

      // Check privacy
      if (entry.isPrivate) {
        if (!currentUserId || entry.userId !== currentUserId) {
          throw new Error("Unauthorized to view this private entry");
        }
      }

      return {
        entry,
        entries: [entry],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
      };
    }

    // Handle regionId parameter - resolve to region list
    let regionList = regions || [];
    if (regionIdParam && regionList.length === 0) {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          regionIdParam
        );

      if (isUUID) {
        regionList = [regionIdParam];
      } else {
        const region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: regionIdParam },
              {
                name: {
                  contains: regionIdParam,
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
          return {
            entry: null,
            entries: [],
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          };
        }
      }
    }

    // Build where clause
    let whereClause: Prisma.LogEntryWhereInput = {};

    const filterUserIdStr = filterUserId;
    const isPrivate = isPrivateParam === true;
    const beachIdStr = beachId;
    const minRatingNum = minRating || 0;
    const maxRatingNum = maxRating || 5;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;

    if (filterUserIdStr) {
      whereClause.userId = filterUserIdStr;

      if (!currentUserId || currentUserId !== filterUserIdStr) {
        whereClause.isPrivate = false;
        whereClause.isAnonymous = false;
      }
    } else {
      if (currentUserId) {
        whereClause.OR = [
          { isPrivate: false, isAnonymous: false },
          { userId: currentUserId },
        ];
      } else {
        whereClause.isPrivate = false;
        whereClause.isAnonymous = false;
      }

      if (isPrivate && currentUserId) {
        whereClause = {
          isPrivate: true,
          userId: currentUserId,
        };
      }
    }

    if (beachIdStr) {
      // Check if beachId is a UUID or a slug
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          beachIdStr
        );

      if (isUUID) {
        // It's a UUID, use it directly
        whereClause.beachId = beachIdStr;
      } else {
        // It's a slug, look up the beach first
        const beach = await prisma.beach.findFirst({
          where: {
            OR: [
              { id: beachIdStr },
              { name: { contains: beachIdStr, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });

        if (beach) {
          whereClause.beachId = beach.id;
        } else {
          // Beach not found, return empty results
          return {
            entry: null,
            entries: [],
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0,
          };
        }
      }
    } else if (beaches && beaches.length > 0) {
      whereClause.beachId = { in: beaches };
    }

    if (regionList.length > 0) {
      whereClause.regionId = { in: regionList };
    }

    if (minRatingNum > 0) {
      whereClause.surferRating = { gte: minRatingNum };
    }

    if (maxRatingNum < 5) {
      whereClause.surferRating = {
        ...((whereClause.surferRating as any) || {}),
        lte: maxRatingNum,
      };
    }

    if (startDate) {
      whereClause.date = {
        ...((whereClause.date as any) || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      whereClause.date = {
        ...((whereClause.date as any) || {}),
        lt: endDateObj,
      };
    }

    const [logEntries, total] = await Promise.all([
      prisma.logEntry.findMany({
        where: whereClause,
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
          imageUrls: true, // Include imageUrls array for multiple images
          videoUrl: true,
          videoPlatform: true,
          userId: true,
          beachName: true,
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
      prisma.logEntry.count({ where: whereClause }),
    ]);

    const enhancedEntries = logEntries.map((entry) => ({
      ...entry,
      hasAlert: entry.alerts.length > 0,
      alertId: entry.alerts[0]?.id || null,
      isMyAlert: entry.alerts.some((alert) => alert.userId === currentUserId),
    }));

    return {
      entry: null,
      entries: enhancedEntries,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Create a raid log entry (more detailed than simple log)
   */
  static async createRaidLogEntry(
    userId: string,
    data: {
      beachName: string;
      date: string;
      surferName: string;
      surferEmail: string;
      surferRating: number;
      comments?: string;
      imageUrl?: string;
      imageUrls?: string[]; // Array of image URLs
      videoUrl?: string;
      videoPlatform?: string;
      isPrivate?: boolean;
      isAnonymous?: boolean;
      waveType?: string;
      beachId?: string;
      regionId: string;
      forecastId?: string;
      forecast?: any;
    }
  ) {
    // Find or create beach
    const beach =
      data.beachId || data.beachName
        ? await prisma.beach.findFirst({
            where: {
              OR: [{ id: data.beachId }, { name: data.beachName }].filter(
                Boolean
              ) as any,
            },
          })
        : null;

    // Verify region exists
    const region = await prisma.region.findUnique({
      where: { id: data.regionId },
    });

    if (!region) {
      throw new Error("Region not found");
    }

    // Find or create forecast
    let forecast = null;

    // Log forecast lookup attempt
    console.log("[createRaidLogEntry] Forecast lookup:", {
      hasForecastId: !!data.forecastId,
      forecastId: data.forecastId,
      hasForecast: !!data.forecast,
      date: data.date,
      regionId: region.id,
    });

    if (data.forecastId) {
      forecast = await prisma.forecast.findUnique({
        where: { id: data.forecastId },
      });
      console.log("[createRaidLogEntry] Forecast lookup by ID:", {
        forecastId: data.forecastId,
        found: !!forecast,
      });
    }

    // If not found by ID, try date/region lookup
    if (!forecast) {
      const logDate = new Date(data.date);
      logDate.setUTCHours(0, 0, 0, 0);

      // Try WINDFINDER first (most common)
      forecast = await prisma.forecast.findFirst({
        where: {
          regionId: region.id,
          date: logDate,
          source: "WINDFINDER",
        },
      });

      if (forecast) {
        console.log(
          "[createRaidLogEntry] Forecast found by date/region (WINDFINDER):",
          {
            forecastId: forecast.id,
            date: forecast.date,
          }
        );
      } else {
        // Try other sources
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId: region.id,
            date: logDate,
          },
          orderBy: {
            source: "asc", // Prefer WINDFINDER, then WINDGURU, then WINDY
          },
        });

        if (forecast) {
          console.log(
            "[createRaidLogEntry] Forecast found by date/region (any source):",
            {
              forecastId: forecast.id,
              source: forecast.source,
              date: forecast.date,
            }
          );
        } else {
          console.warn(
            "[createRaidLogEntry] No forecast found for date/region:",
            {
              date: logDate.toISOString(),
              regionId: region.id,
            }
          );
        }
      }
    }

    // Create log entry
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
        imageUrls:
          data.imageUrls && data.imageUrls.length > 0
            ? Array.isArray(data.imageUrls)
              ? data.imageUrls
              : [data.imageUrls]
            : undefined,
        videoUrl: data.videoUrl,
        videoPlatform: data.videoPlatform,
        waveType: data.waveType,
        user: {
          connect: { id: userId },
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

    return logEntry;
  }

  /**
   * Update a log entry
   */
  static async updateLogEntry(
    logEntryId: string,
    userId: string,
    updateData: {
      surferName?: string;
      surferEmail?: string;
      surferRating?: number;
      comments?: string;
      isPrivate?: boolean;
      isAnonymous?: boolean;
      imageUrl?: string;
      imageUrls?: string[]; // Array of image URLs
      videoUrl?: string;
      videoPlatform?: string;
      waveType?: string;
      beachId?: string;
      beachName?: string;
      regionId?: string;
      date?: string;
      forecastId?: string;
    }
  ) {
    // Verify ownership
    const existingEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
      select: { userId: true },
    });

    if (!existingEntry) {
      throw new Error("Log entry not found");
    }

    if (existingEntry.userId !== userId) {
      throw new Error("Unauthorized to update this log entry");
    }

    // Handle beach and region updates
    let beach = null;
    if (updateData.beachId || updateData.beachName) {
      beach = await prisma.beach.findFirst({
        where: {
          OR: [
            { id: updateData.beachId },
            { name: updateData.beachName },
          ].filter(Boolean) as any,
        },
      });
    }

    let region = null;
    if (updateData.regionId) {
      region = await prisma.region.findUnique({
        where: { id: updateData.regionId },
      });
    }

    // Handle forecast
    let forecast = null;

    console.log("[updateLogEntry] Forecast lookup:", {
      hasForecastId: !!updateData.forecastId,
      forecastId: updateData.forecastId,
      hasDate: !!updateData.date,
      hasRegion: !!region,
      date: updateData.date,
      regionId: region?.id,
    });

    if (updateData.forecastId) {
      forecast = await prisma.forecast.findUnique({
        where: { id: updateData.forecastId },
      });
      console.log("[updateLogEntry] Forecast lookup by ID:", {
        forecastId: updateData.forecastId,
        found: !!forecast,
      });
    }

    // If not found by ID, try date/region lookup
    if (!forecast && updateData.date && region) {
      const logDate = new Date(updateData.date);
      logDate.setUTCHours(0, 0, 0, 0);

      // Try WINDFINDER first (most common)
      forecast = await prisma.forecast.findFirst({
        where: {
          regionId: region.id,
          date: logDate,
          source: "WINDFINDER",
        },
      });

      if (forecast) {
        console.log(
          "[updateLogEntry] Forecast found by date/region (WINDFINDER):",
          {
            forecastId: forecast.id,
            date: forecast.date,
          }
        );
      } else {
        // Try any source
        forecast = await prisma.forecast.findFirst({
          where: {
            regionId: region.id,
            date: logDate,
          },
          orderBy: {
            source: "asc",
          },
        });

        if (forecast) {
          console.log(
            "[updateLogEntry] Forecast found by date/region (any source):",
            {
              forecastId: forecast.id,
              source: forecast.source,
              date: forecast.date,
            }
          );
        } else {
          console.warn("[updateLogEntry] No forecast found for date/region:", {
            date: logDate.toISOString(),
            regionId: region.id,
          });
        }
      }
    }

    // Build update payload
    const updatePayload: Prisma.LogEntryUpdateInput = {
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
      ...(updateData.imageUrls !== undefined && {
        imageUrls:
          updateData.imageUrls && updateData.imageUrls.length > 0
            ? Array.isArray(updateData.imageUrls)
              ? updateData.imageUrls
              : [updateData.imageUrls]
            : Prisma.JsonNull,
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
      where: { id: logEntryId },
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

    return logEntry;
  }

  /**
   * Delete a log entry
   */
  static async deleteLogEntry(logEntryId: string, userId: string) {
    const logEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
      select: { userId: true },
    });

    if (!logEntry) {
      throw new Error("Log entry not found");
    }

    if (logEntry.userId !== userId) {
      throw new Error("Unauthorized to delete this log entry");
    }

    await prisma.logEntry.delete({
      where: { id: logEntryId },
    });

    return { success: true };
  }

  /**
   * Get user's log entries
   */
  static async getUserLogEntries(userId: string) {
    const entries = await prisma.logEntry.findMany({
      where: {
        userId,
      },
      include: {
        forecast: true,
      },
      orderBy: { date: "desc" },
    });

    return entries.map((entry) => {
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
  }
}
