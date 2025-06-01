import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const regionId = url.searchParams.get("regionId");

  try {
    const beaches = await prisma.beach.findMany({
      where: regionId
        ? {
            OR: [
              { regionId },
              { region: { name: regionId } }, // Also search by region name
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        optimalWindDirections: true,
        optimalSwellDirections: true,
        swellSize: true,
        idealSwellPeriod: true,
        region: {
          include: {
            country: true,
          },
        },
        difficulty: true,
        waveType: true,
        location: true,
        distanceFromCT: true,
        bestSeasons: true,
        optimalTide: true,
        description: true,
        waterTemp: true,
        hazards: true,
        crimeLevel: true,
        sharkAttack: true,
        coordinates: true,
        sheltered: true,
      },
    });

    console.log(`Found ${beaches.length} beaches for region: ${regionId}`);
    return NextResponse.json(beaches);
  } catch (error) {
    console.error("Error fetching beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
