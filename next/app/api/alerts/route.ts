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
  range: z.number().min(0.1).max(100), // Allow smaller ranges for exact matches (e.g., 0.5 for swellHeight)
  sourceType: z.enum(["beach_optimal", "log_entry", "custom"]).optional(),
  sourceId: z.string().optional(),
});

const AlertSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    regionId: z.string().min(1, "Region is required"),
    forecastDate: z.union([z.string(), z.date()]).optional(),
    properties: z.array(AlertPropertySchema).optional(),
    notificationMethod: z.enum(["email", "whatsapp", "both", "app"]),
    contactInfo: z.string().min(1, "Contact information is required"),
    active: z.boolean().default(true),
    logEntryId: z.string().nullable().optional(),
    beachId: z.string().nullable().optional(),
    alertType: z.nativeEnum(AlertType).default(AlertType.VARIABLES),
    starRating: z.number().min(1).max(5).nullable().optional(),
  })
  .refine(
    (data) => {
      // If alertType is VARIABLES, properties are required
      if (data.alertType === AlertType.VARIABLES) {
        return data.properties && data.properties.length > 0;
      }
      return true;
    },
    {
      message:
        "At least one forecast property is required for VARIABLES alerts",
      path: ["properties"],
    }
  )
  .refine(
    (data) => {
      // If alertType is RATING, starRating is required
      if (data.alertType === AlertType.RATING) {
        return data.starRating !== null && data.starRating !== undefined;
      }
      return true;
    },
    {
      message: "Star rating is required for RATING alerts",
      path: ["starRating"],
    }
  );

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
          regionId: true,
        },
        distinct: ["regionId"],
      });

      const regions = forecasts.map((forecast) => forecast.regionId);
      return NextResponse.json(regions);
    }

    if (region) {
      const forecasts = await prisma.forecastA.findMany({
        where: {
          regionId: region,
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
      ...(data.properties &&
        data.properties.length > 0 && {
          properties: {
            create: data.properties.map((prop) => ({
              property: prop.property,
              optimalValue: prop.optimalValue,
              range: prop.range,
              // Note: sourceType and sourceId are not in the Prisma schema
            })),
          },
        }),
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

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create alert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
