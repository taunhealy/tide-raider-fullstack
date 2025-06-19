import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = await params;
    const beachName = decodeURIComponent(name);

    const beach = await prisma.beach.findFirst({
      where: {
        name: beachName,
      },
      select: {
        id: true,
        name: true,
        optimalWindDirections: true,
        optimalSwellDirections: true,
        swellSize: true,
        idealSwellPeriod: true,
        waterTemp: true,
      },
    });

    if (!beach) {
      return NextResponse.json({ error: "Beach not found" }, { status: 404 });
    }

    // Transform the data to ensure proper typing
    const transformedBeach = {
      ...beach,
      optimalWindDirections: Array.isArray(beach.optimalWindDirections)
        ? beach.optimalWindDirections
        : [],
      optimalSwellDirections:
        typeof beach.optimalSwellDirections === "object"
          ? beach.optimalSwellDirections
          : { min: 0, max: 0, cardinal: "N" },
      swellSize:
        typeof beach.swellSize === "object"
          ? beach.swellSize
          : { min: 0, max: 0 },
      idealSwellPeriod:
        typeof beach.idealSwellPeriod === "object"
          ? beach.idealSwellPeriod
          : { min: 0, max: 0 },
    };

    return NextResponse.json(transformedBeach);
  } catch (error) {
    console.error("Error fetching beach:", error);
    return NextResponse.json(
      { error: "Failed to fetch beach details" },
      { status: 500 }
    );
  }
}
