import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const logEntryId = params.id;

    // Fetch the log entry without using include
    const logEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
    });

    if (!logEntry) {
      return NextResponse.json(
        { error: "Log entry not found" },
        { status: 404 }
      );
    }

    // Check if the log entry is private and belongs to the user
    if (logEntry.isPrivate) {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user ID
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      });

      if (!user || logEntry.userId !== user.id) {
        return NextResponse.json(
          { error: "You don't have permission to access this log entry" },
          { status: 403 }
        );
      }
    }

    // Fetch forecast data separately if needed
    const forecastData = await prisma.forecastA.findFirst({
      where: {
        region: logEntry.region || "",
        date: logEntry.date,
      },
    });

    // Combine the data
    const result = {
      ...logEntry,
      forecast: forecastData || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching log entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch log entry" },
      { status: 500 }
    );
  }
}
