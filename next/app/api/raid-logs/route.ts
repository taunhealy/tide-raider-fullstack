import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

import { z } from "zod";

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
  region: z.string(),
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

// Add this helper function at the top
async function getForecast(date: Date, region: string) {
  return prisma.forecastA.findFirst({
    where: {
      date: {
        gte: new Date(date.setUTCHours(0, 0, 0, 0)),
        lt: new Date(date.setUTCDate(date.getUTCDate() + 1)),
      },
      region: region,
    },
    select: {
      // Remove the 'forecast' field from selection
      windSpeed: true,
      windDirection: true,
      swellHeight: true,
      swellPeriod: true,
      swellDirection: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

// Update the GET endpoint to handle forecast requests
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Extract all filter parameters
  const beaches = searchParams.get("beaches")?.split(",").filter(Boolean) || [];
  const regions = searchParams.get("regions")?.split(",").filter(Boolean) || [];
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

  const session = await getServerSession(authOptions);

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
    if (beaches.length > 0) whereClause.beachName = { in: beaches };
    if (regions.length > 0) whereClause.region = { in: regions };
    if (countries.length > 0) whereClause.country = { in: countries };
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

    console.log("Where clause:", JSON.stringify(whereClause, null, 2));

    // Fetch log entries
    const logEntries = await prisma.logEntry.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        date: true,
        surferName: true,
        surferEmail: true,
        beachName: true,
        surferRating: true,
        comments: true,
        isPrivate: true,
        isAnonymous: true,
        continent: true,
        country: true,
        region: true,
        waveType: true,
        imageUrl: true,
        videoUrl: true,
        videoPlatform: true,
        userId: true,
        forecast: true,
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

    console.log(`Found ${logEntries.length} log entries`);

    // Update the enhancedEntries mapping to include alert ownership info
    const enhancedEntries = logEntries.map((entry) => ({
      ...entry,
      hasAlert: entry.alerts.length > 0,
      alertId: entry.alerts[0]?.id || null,
      // Add a flag to indicate if the alert belongs to the current user
      isMyAlert: entry.alerts.some(
        (alert) => alert.userId === session?.user?.id
      ),
    }));

    return NextResponse.json(enhancedEntries);
  } catch (error) {
    console.error("❌ Error fetching raid logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Extract forecast data from the request
    const forecastData = data.forecast || data.forecastData;

    if (!forecastData) {
      return NextResponse.json(
        { error: "Missing forecast data" },
        { status: 400 }
      );
    }

    // Just use the date string directly, Prisma will handle it as a date-only field
    const forecast = await prisma.forecastA.upsert({
      where: {
        date_region: {
          date: new Date(data.date), // Prisma will ignore time with @db.Date
          region: data.region,
        },
      },
      create: {
        date: new Date(data.date), // Prisma will ignore time with @db.Date
        region: data.region,
        windSpeed: forecastData.windSpeed,
        windDirection: forecastData.windDirection,
        swellHeight: forecastData.swellHeight,
        swellPeriod: forecastData.swellPeriod,
        swellDirection: forecastData.swellDirection,
      },
      update: {},
    });

    const logEntry = await prisma.logEntry.create({
      data: {
        beachName: data.beachName,
        date: new Date(data.date),
        surferEmail: session.user.email,
        surferName: data.surferName,
        surferRating: data.surferRating,
        comments: data.comments,
        continent: data.continent,
        country: data.country,
        region: data.region,
        waveType: data.waveType,
        isAnonymous: data.isAnonymous,
        isPrivate: data.isPrivate,
        imageUrl: data.imageUrl,
        user: {
          connect: { id: session.user.id },
        },
        forecast: {
          connect: { id: forecast.id },
        },
      },
      include: {
        forecast: true,
      },
    });

    // If createAlert is true, create an alert
    if (data.createAlert && data.alertConfig) {
      const alertConfig = data.alertConfig;

      await prisma.alert.create({
        data: {
          name: alertConfig.name,
          region: alertConfig.region || data.region,
          forecastDate: new Date(data.date),
          properties: alertConfig.properties,
          notificationMethod: alertConfig.notificationMethod,
          contactInfo: alertConfig.contactInfo,
          active: alertConfig.active,
          alertType: alertConfig.alertType || "variables",
          starRating: alertConfig.starRating,
          user: {
            connect: { id: session.user.id },
          },
          logEntry: {
            connect: { id: logEntry.id },
          },
          forecast: {
            connect: { id: forecast.id },
          },
        },
      });
    }

    return NextResponse.json(logEntry);
  } catch (error) {
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Failed to create log entry" },
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
