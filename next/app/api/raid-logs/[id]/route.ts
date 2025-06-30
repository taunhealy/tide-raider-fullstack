import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json(
        { error: "Missing ID parameter" },
        { status: 400 }
      );
    }

    const entry = await prisma.logEntry.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        date: true, // DateTime @db.Date
        surferName: true, // String?
        surferEmail: true, // String?
        beachName: true, // String?
        surferRating: true, // Int @default(0)
        comments: true, // String?
        createdAt: true, // DateTime @default(now())
        updatedAt: true, // DateTime @updatedAt
        imageUrl: true, // String?
        videoUrl: true,
        videoPlatform: true,
        isPrivate: true, // Boolean @default(false)
        isAnonymous: true, // Boolean @default(false)
        continent: true,
        country: true,
        region: true,
        waveType: true, // String?
        beachId: true, // String?
        userId: true, // String? @map("user_id")
        forecast: {
          select: {
            id: true,
            date: true,
            windSpeed: true,
            windDirection: true,
            swellHeight: true,
            swellPeriod: true,
            swellDirection: true,
            regionId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            nationality: true,
            email: true,
          },
        },
        beach: {
          select: {
            id: true,
            name: true,
            region: true,
            country: true,
            continent: true,
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

    console.log("API Response:", {
      id: entry.id,
      region: entry.region,
      country: entry.country,
      continent: entry.continent,
      fullEntry: entry,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to fetch log entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return new Response("Unauthorized", { status: 401 });

    const entry = await prisma.logEntry.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        surferEmail: true,
      },
    });

    if (entry?.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    await prisma.logEntry.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if the entry belongs to the user
    const existingEntry = await prisma.logEntry.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        imageUrl: true, // Add this to get existing image URL
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existingEntry.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const data = await request.json();

    // Remove fields that aren't in the LogEntry schema
    const {
      createAlert,
      alertConfig,
      forecast,
      userId,
      user,
      id,
      ...logEntryData
    } = data;

    // Ensure date is in ISO format
    if (logEntryData.date) {
      logEntryData.date = new Date(logEntryData.date).toISOString();
    }

    // Only update imageUrl if it's different from the existing one
    if (logEntryData.imageUrl === undefined) {
      delete logEntryData.imageUrl; // Don't update if not provided
    }

    // Update the log entry with cleaned data
    const updatedLogEntry = await prisma.logEntry.update({
      where: {
        id: params.id,
      },
      data: logEntryData,
      include: {
        forecast: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Handle alert update or creation
    if (alertConfig) {
      const {
        userId,
        id: alertId,
        logEntryId,
        forecast,
        date,
        ...cleanAlertConfig
      } = alertConfig;

      if (alertId) {
        await prisma.alert.update({
          where: { id: alertId },
          data: {
            ...cleanAlertConfig,
            properties: alertConfig.properties || [
              { property: "windSpeed", range: 2 },
              { property: "windDirection", range: 10 },
              { property: "swellHeight", range: 0.2 },
              { property: "swellPeriod", range: 1 },
              { property: "swellDirection", range: 10 },
            ],
            notificationMethod: alertConfig.notificationMethod || "app",
            contactInfo: alertConfig.contactInfo || session.user.email || "",
            forecastDate: new Date(data.date),
            alertType: alertConfig.alertType || "variables",
            starRating: alertConfig.starRating || null,
          },
        });
      } else if (createAlert) {
        await prisma.alert.create({
          data: {
            name:
              updatedLogEntry.beachName ||
              updatedLogEntry.regionId ||
              "Unnamed location",
            regionId: updatedLogEntry.regionId || "",
            properties: alertConfig.properties || [
              { property: "windSpeed", range: 2 },
              { property: "windDirection", range: 10 },
              { property: "swellHeight", range: 0.2 },
              { property: "swellPeriod", range: 1 },
              { property: "swellDirection", range: 10 },
            ],
            notificationMethod: alertConfig.notificationMethod || "app",
            contactInfo: alertConfig.contactInfo || session.user.email || "",
            active: true,
            userId: session.user.id,
            logEntryId: params.id,
            forecastDate: new Date(updatedLogEntry.date),
            alertType: alertConfig.alertType || "variables",
            starRating: alertConfig.starRating || null,
          },
        });
      }
    }

    return NextResponse.json(updatedLogEntry);
  } catch (error) {
    console.error("Error updating log entry:", error);
    return NextResponse.json(
      { error: "Failed to update log entry" },
      { status: 500 }
    );
  }
}
