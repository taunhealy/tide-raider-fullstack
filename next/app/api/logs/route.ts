import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch log entries with both forecast and alerts
    const logEntries = await prisma.logEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      include: {
        forecast: true, // Include ForecastA data
        alerts: {
          select: {
            id: true,
            properties: true,
            forecastId: true, // Include reference to forecast
          },
        },
      },
    });

    const enhancedLogEntries = logEntries.map((entry) => ({
      ...entry,
      hasAlert: entry.alerts.length > 0,
      alertId: entry.alerts[0]?.id || null,
      // Structured forecast data now comes from the relation
      forecast: entry.forecast
        ? {
            windSpeed: entry.forecast.windSpeed,
            windDirection: entry.forecast.windDirection,
            swellHeight: entry.forecast.swellHeight,
            swellPeriod: entry.forecast.swellPeriod,
            swellDirection: entry.forecast.swellDirection,
          }
        : null,
    }));

    return NextResponse.json(enhancedLogEntries);
  } catch (error) {
    console.error("Error fetching log entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch log entries" },
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

    // First, create or find the ForecastA record
    const forecast = await prisma.forecastA.upsert({
      where: {
        date_region: {
          date: new Date(data.date),
          region: data.region,
        },
      },
      create: {
        date: new Date(data.date),
        region: data.region,
        windSpeed: data.forecast.windSpeed,
        windDirection: data.forecast.windDirection,
        swellHeight: data.forecast.swellHeight,
        swellPeriod: data.forecast.swellPeriod,
        swellDirection: data.forecast.swellDirection,
      },
      update: {}, // Don't update if exists
    });

    // Then create the log entry with the forecast relation
    const logEntry = await prisma.logEntry.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId: session.user.id,
        forecastId: forecast.id, // Link to the forecast
      },
      include: {
        forecast: true,
        alerts: true,
      },
    });

    return NextResponse.json(logEntry);
  } catch (error) {
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Failed to create log entry" },
      { status: 500 }
    );
  }
}
