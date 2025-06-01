import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const continentId = url.searchParams.get("continentId");
  const countryId = url.searchParams.get("countryId");

  try {
    // Handle different types of geo data
    switch (type) {
      case "continents":
        const continents = await prisma.continent.findMany();
        return NextResponse.json(continents);

      case "countries":
        const countries = await prisma.country.findMany({
          where: continentId ? { continentId } : undefined,
          include: { continent: true },
        });
        return NextResponse.json(countries);

      case "regions":
        const regions = await prisma.region.findMany({
          where: countryId ? { countryId } : undefined,
          include: {
            country: {
              include: { continent: true },
            },
          },
        });
        return NextResponse.json(regions);

      case "all":
        // Fetch all geographic data in parallel
        const [allContinents, allCountries, allRegions] = await Promise.all([
          prisma.continent.findMany(),
          prisma.country.findMany({ include: { continent: true } }),
          prisma.region.findMany({
            include: {
              country: {
                include: { continent: true },
              },
            },
          }),
        ]);

        return NextResponse.json({
          continents: allContinents,
          countries: allCountries,
          regions: allRegions,
        });

      default:
        return NextResponse.json(
          { error: "Invalid geo data type requested" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching geographic data:", error);
    return NextResponse.json(
      { error: "Failed to fetch geographic data" },
      { status: 500 }
    );
  }
}
