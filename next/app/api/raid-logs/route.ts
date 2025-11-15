import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

import { z } from "zod";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

function getTodayDate() {
  const date = new Date();
  return date.toISOString().split("T")[0];
}

// Add Zod validation for input types
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

const forecastSchema = z.object({
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
});

interface Forecast {
  wind?: { speed: number; direction: string };
  swell?: {
    height: number;
    period: number;
    direction: string;
    cardinalDirection: string;
  };
}

// Update getForecast function to use regionId
async function getForecast(date: Date, regionId: string) {
  return prisma.forecastA.findFirst({
    where: {
      date: {
        gte: new Date(date.setUTCHours(0, 0, 0, 0)),
        lt: new Date(date.setUTCDate(date.getUTCDate() + 1)),
      },
      regionId: regionId, // Use regionId instead of region
    },
    select: {
      windSpeed: true,
      windDirection: true,
      swellHeight: true,
      swellPeriod: true,
      swellDirection: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}

// Update the GET endpoint to handle forecast requests
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // If an ID is provided, fetch a single log entry
  const id = searchParams.get("id");
  if (id) {
    try {
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
        return NextResponse.json(
          { error: "Log entry not found" },
          { status: 404 }
        );
      }

      // Check privacy settings
      if (entry.isPrivate) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || entry.userId !== session.user.id) {
          return NextResponse.json(
            { error: "Unauthorized to view this private entry" },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(entry);
    } catch (error) {
      console.error("Failed to fetch log entry:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Otherwise, handle the list query (existing code)
  const beaches = searchParams.get("beaches")?.split(",").filter(Boolean) || [];
  let regions = searchParams.get("regions")?.split(",").filter(Boolean) || [];
  const regionIdParam = searchParams.get("regionId"); // Handle single regionId parameter
  const countries =
    searchParams.get("countries")?.split(",").filter(Boolean) || [];
  const minRating = Number(searchParams.get("minRating")) || 0;
  const maxRating = Number(searchParams.get("maxRating")) || 5;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const isPrivate = searchParams.get("isPrivate") === "true";
  const filterUserId = searchParams.get("userId");
  const beachId = searchParams.get("beachId");

  // If regionId is provided, convert slug to UUID if needed
  if (regionIdParam && regions.length === 0) {
    try {
      // Check if it's already a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          regionIdParam
        );

      if (isUUID) {
        regions = [regionIdParam];
      } else {
        // It's a slug, find the region by id (slug) or name
        const region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: regionIdParam },
              { name: { contains: regionIdParam, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });

        if (region) {
          regions = [region.id];
        } else {
          console.warn(`Region not found for regionId: ${regionIdParam}`);
          // Return empty results instead of erroring
          return NextResponse.json({
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
      // Return empty results if region lookup fails
      return NextResponse.json({
        entries: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });
    }
  }

  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (sessionError) {
    console.error("Error getting session:", sessionError);
    // Continue without session - will show only public logs
    session = null;
  }

  try {
    // Build dynamic where clause
    let whereClause: any = {};

    // If a specific userId filter is provided, use it
    if (filterUserId) {
      whereClause.userId = filterUserId;

      // If viewing someone else's profile (not your own)
      if (!session?.user?.id || session.user.id !== filterUserId) {
        // Only show public logs that are not anonymous
        whereClause.isPrivate = false;
        whereClause.isAnonymous = false;
      }
      // If viewing your own profile, show all your logs (including anonymous ones)
    } else {
      // Original privacy logic when not filtering by userId
      if (session?.user?.id) {
        // If user is logged in, show:
        // 1. Public logs that are not anonymous, OR
        // 2. Their own logs (both private and anonymous)
        whereClause.OR = [
          { isPrivate: false, isAnonymous: false },
          { userId: session.user.id },
        ];
      } else {
        // If not logged in, only show public logs that are not anonymous
        whereClause.isPrivate = false;
        whereClause.isAnonymous = false;
      }

      // Override with isPrivate filter if specifically requested
      if (isPrivate && session?.user?.id) {
        whereClause = {
          isPrivate: true,
          userId: session.user.id,
        };
      }
    }

    // Add other filters
    if (beachId) {
      whereClause.beachId = beachId;
    } else if (beaches.length > 0) {
      whereClause.beachId = { in: beaches };
    }
    if (regions.length > 0) whereClause.regionId = { in: regions };
    // Note: LogEntry doesn't have a direct country field, only regionId
    // Country filtering would require joining through region relation
    // For now, country filtering is disabled to avoid Prisma errors
    if (minRating > 0) whereClause.surferRating = { gte: minRating };
    if (maxRating < 5)
      whereClause.surferRating = {
        ...(whereClause.surferRating || {}),
        lte: maxRating,
      };

    // Handle date filters
    if (startDate) {
      whereClause.date = {
        ...(whereClause.date || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      // Add one day to endDate to include the entire day
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      whereClause.date = { ...(whereClause.date || {}), lt: endDateObj };
    }

    // Validate whereClause before querying - ensure it's a valid Prisma where clause
    // Prisma where clauses can have nested objects, so we need to be careful
    if (
      !whereClause ||
      typeof whereClause !== "object" ||
      Array.isArray(whereClause)
    ) {
      whereClause = {};
    }

    // Remove top-level undefined/null values, but preserve nested Prisma operators (in, OR, etc.)
    const cleanedWhereClause: any = {};
    for (const [key, value] of Object.entries(whereClause)) {
      if (value !== undefined && value !== null) {
        // If it's a Prisma operator object (like { in: [...] } or { OR: [...] }), keep it as is
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
          // Simple values or arrays
          cleanedWhereClause[key] = value;
        }
      }
    }
    whereClause = cleanedWhereClause;

    console.log("Where clause:", JSON.stringify(whereClause, null, 2));

    // Add total count query alongside entries query
    const [logEntries, total] = await Promise.all([
      prisma.logEntry.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
          // Include full region relation
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
          // Update the forecast selection to include all necessary fields
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

    console.log(`Found ${logEntries.length} log entries`);

    // Update the enhancedEntries mapping to include alert ownership info
    const enhancedEntries = logEntries.map((entry) => ({
      ...entry,
      hasAlert: entry.alerts.length > 0,
      alertId: entry.alerts[0]?.id || null,
      isMyAlert: entry.alerts.some(
        (alert) => alert.userId === session?.user?.id
      ),
    }));

    // Return the correct structure
    return NextResponse.json({
      entries: enhancedEntries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error fetching raid logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const data = await request.json();

    // First find the beach and region
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
      return NextResponse.json(
        { message: "Region not found" },
        { status: 404 }
      );
    }

    // Find or create forecast for the date and region
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

    // Create the log entry with proper relations
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

        // Relations using connect
        user: {
          connect: { id: session.user.id },
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

    return NextResponse.json(logEntry);
  } catch (error) {
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create log entry",
      },
      { status: 500 }
    );
  }
}

// Add conversion helper
function convertDegreesToCardinal(degrees: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index] || "N/A";
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { message: "Log entry ID is required" },
        { status: 400 }
      );
    }

    // Check if the log entry exists and belongs to the user
    const existingEntry = await prisma.logEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { message: "Log entry not found" },
        { status: 404 }
      );
    }

    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized to update this log entry" },
        { status: 403 }
      );
    }

    // Find the beach and region if provided
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

    // Find or use existing forecast
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

    // Prepare update data
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

    // Update relations
    if (beach) {
      updatePayload.beach = { connect: { id: beach.id } };
    }
    if (region) {
      updatePayload.region = { connect: { id: region.id } };
    }
    if (forecast) {
      updatePayload.forecast = { connect: { id: forecast.id } };
    }

    // Update the log entry
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

    return NextResponse.json(logEntry);
  } catch (error) {
    console.error("Error updating log entry:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update log entry",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get ID from query parameters instead of URL path
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "No ID provided" }, { status: 400 });
    }

    // Check if the log entry exists and belongs to the user
    const logEntry = await prisma.logEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!logEntry) {
      return NextResponse.json(
        { message: "Log entry not found" },
        { status: 404 }
      );
    }

    if (logEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized to delete this log entry" },
        { status: 403 }
      );
    }

    // Delete the log entry
    await prisma.logEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Log entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting log entry:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete log entry",
      },
      { status: 500 }
    );
  }
}
