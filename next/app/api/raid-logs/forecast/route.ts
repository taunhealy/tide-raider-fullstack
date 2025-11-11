import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const date = searchParams.get("date");

  if (!region || !date) {
    return NextResponse.json(
      { error: "Missing region or date" },
      { status: 400 }
    );
  }

  try {
    // Find or create forecast
    const dateOnly = new Date(date).toISOString().split("T")[0];
    const forecast = await prisma.forecastA.findFirst({
      where: {
        date: new Date(dateOnly),
        regionId: region,
      },
    });

    if (!forecast) {
      const createdForecast = await prisma.forecastA.create({
        data: {
          date: new Date(dateOnly),
          regionId: region,
        },
      });
      return NextResponse.json(createdForecast);
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast" },
      { status: 500 }
    );
  }
}
