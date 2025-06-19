import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { AlertType, Prisma } from "@prisma/client";

// Improve validation schema
const AlertPropertySchema = z.object({
  property: z.enum([
    "windSpeed",
    "windDirection",
    "swellHeight",
    "swellPeriod",
    "swellDirection",
    "waveHeight",
    "wavePeriod",
    "temperature",
  ]),
  optimalValue: z.number(),
  range: z.number().min(1).max(100),
  sourceType: z.enum(["beach_optimal", "log_entry", "custom"]).optional(),
  sourceId: z.string().optional(),
});

const AlertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  regionId: z.string().min(1, "Region is required"),
  forecastDate: z.union([z.string(), z.date()]).optional(),
  properties: z
    .array(AlertPropertySchema)
    .min(1, "At least one property is required"),
  notificationMethod: z.enum(["email", "whatsapp", "both", "app"]),
  contactInfo: z.string().min(1, "Contact information is required"),
  active: z.boolean().default(true),
  logEntryId: z.string().nullable().optional(),
  beachId: z.string().nullable().optional(),
  alertType: z.nativeEnum(AlertType).default(AlertType.VARIABLES),
  starRating: z.number().min(1).max(5).nullable().optional(),
});

// Type the create operation
type AlertCreateInput = Prisma.AlertCreateInput;

// Add this near the top with other constants
const AVAILABLE_STAR_RATINGS = ["3+", "4+", "5"] as const;

// GET - Fetch alerts, regions, or dates based on query parameters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.has("starRatings")) {
    return NextResponse.json(AVAILABLE_STAR_RATINGS);
  }

  const region = searchParams.get("region");
  const logEntryId = searchParams.get("logEntryId");
  const isBetaMode = process.env.NEXT_PUBLIC_APP_MODE === "beta";

  try {
    // Get session - but don't immediately return 401 if not authenticated
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.id;

    // Case 0: If logEntryId is provided...
    if (logEntryId) {
      // Only require authentication if not in beta mode
      if (!isAuthenticated && !isBetaMode) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const logEntry = await prisma.logEntry.findUnique({
        where: { id: logEntryId },
        select: {
          forecast: true,
          region: true,
          date: true,
        },
      });

      if (!logEntry) {
        return NextResponse.json(
          { error: "Log entry not found" },
          { status: 404 }
        );
      }

      // Check for existing alert only if authenticated
      let existingAlert = null;
      if (isAuthenticated) {
        existingAlert = await prisma.alert.findFirst({
          where: {
            logEntryId: logEntryId,
            userId: session.user.id,
          },
        });
      }

      return NextResponse.json({
        forecast: logEntry.forecast,
        region: logEntry.region,
        date: logEntry.date,
        ...(existingAlert && { id: existingAlert.id }),
      });
    }

    // Case 1 & 2: Region-related queries don't need authentication
    if (searchParams.has("region") && !region) {
      const forecasts = await prisma.forecastA.findMany({
        select: {
          region: true,
        },
        distinct: ["region"],
      });

      const regions = forecasts.map((forecast) => forecast.region);
      return NextResponse.json(regions);
    }

    if (region) {
      const forecasts = await prisma.forecastA.findMany({
        where: {
          region: region,
        },
        select: {
          date: true,
        },
        orderBy: {
          date: "asc",
        },
        distinct: ["date"],
      });

      const dates = forecasts.map(
        (forecast) => forecast.date.toISOString().split("T")[0]
      );
      return NextResponse.json(dates);
    }

    // Case 3: Fetching user's alerts - requires authentication
    if (!isAuthenticated) {
      if (isBetaMode) {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        properties: true,
        region: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: true,
      },
      orderBy: {
        forecastDate: "desc",
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// POST - Create a new alert
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = AlertSchema.parse(await req.json());

    const createInput: AlertCreateInput = {
      name: data.name,
      region: {
        connect: { id: data.regionId },
      },
      notificationMethod: data.notificationMethod,
      contactInfo: data.contactInfo,
      active: data.active,
      user: {
        connect: { id: session.user.id },
      },
      forecastDate: new Date(data.forecastDate || Date.now()),
      alertType: data.alertType,
      starRating: data.starRating,
      properties: {
        create: data.properties.map((prop) => ({
          property: prop.property,
          optimalValue: prop.optimalValue,
          range: prop.range,
          sourceType: prop.sourceType,
          sourceId: prop.sourceId,
        })),
      },
      ...(data.logEntryId && {
        logEntry: { connect: { id: data.logEntryId } },
      }),
      ...(data.beachId && {
        beach: { connect: { id: data.beachId } },
      }),
    };

    const alert = await prisma.alert.create({
      data: createInput,
      include: {
        properties: true,
        region: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: true,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Alert creation error details:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
