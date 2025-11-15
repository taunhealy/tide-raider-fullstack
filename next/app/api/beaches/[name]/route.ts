import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const beachName = decodeURIComponent(name);

    console.log(`[beaches/[name]] Looking up beach: "${beachName}"`);

    // First, try matching by ID (UUID format check)
    // UUIDs are typically 36 characters with dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        beachName
      );

    let beach = null;

    if (isUUID) {
      console.log(`[beaches/[name]] Treating as UUID, looking up by ID`);
      beach = await prisma.beach.findUnique({
        where: {
          id: beachName,
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
    }

    // If not found by ID, try exact name match
    if (!beach) {
      console.log(`[beaches/[name]] Trying exact name match`);
      beach = await prisma.beach.findFirst({
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
    }

    // If not found, try case-insensitive search
    if (!beach) {
      console.log(`[beaches/[name]] Trying case-insensitive name match`);
      beach = await prisma.beach.findFirst({
        where: {
          name: {
            equals: beachName,
            mode: "insensitive",
          },
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
    }

    // If still not found, try with spaces/hyphens normalized
    if (!beach) {
      const normalizedName = beachName.replace(/[-_]/g, " ").trim();
      const hyphenatedName = beachName.replace(/\s+/g, "-");

      console.log(
        `[beaches/[name]] Trying normalized: "${normalizedName}" and hyphenated: "${hyphenatedName}"`
      );

      beach = await prisma.beach.findFirst({
        where: {
          OR: [
            {
              name: {
                equals: normalizedName,
                mode: "insensitive",
              },
            },
            {
              name: {
                equals: hyphenatedName,
                mode: "insensitive",
              },
            },
            // Also try the original with spaces/hyphens swapped
            {
              name: {
                contains: normalizedName,
                mode: "insensitive",
              },
            },
          ],
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
    }

    if (!beach) {
      console.log(`[beaches/[name]] Beach not found: "${beachName}"`);
      return NextResponse.json(
        {
          error: "Beach not found",
          message: `Could not find beach with name or ID: ${beachName}`,
        },
        { status: 404 }
      );
    }

    console.log(
      `[beaches/[name]] Found beach: "${beach.name}" (ID: ${beach.id})`
    );

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
