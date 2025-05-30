import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = request.url.split("/").pop()?.split("?")[0];

    const entries = await prisma.logEntry.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        forecast: true, // Include the forecast relation
      },
      orderBy: { date: "desc" },
    });

    // Properly expand the forecast data
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

    return NextResponse.json(transformedEntries);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// Add this conversion helper
function convertDegreesToCardinal(degrees: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index] || "N/A";
}
