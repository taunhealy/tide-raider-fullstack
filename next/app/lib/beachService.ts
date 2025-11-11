/**
 * Beach Service
 * Central service for all beach-related database queries
 * Replaces static beachData.ts with dynamic database queries
 */

import { prisma } from "@/app/lib/prisma";
import { Beach, Region, Country, Prisma } from "@prisma/client";

// Type definitions for beach with relations
export type BeachWithRelations = Beach & {
  region?: Region | null;
  country?: Country | null;
};

// Standard beach select for most queries (optimized to reduce data transfer)
export const standardBeachSelect = {
  id: true,
  name: true,
  continent: true,
  countryId: true,
  regionId: true,
  location: true,
  distanceFromCT: true,
  optimalWindDirections: true,
  optimalSwellDirections: true,
  bestSeasons: true,
  optimalTide: true,
  description: true,
  difficulty: true,
  waveType: true,
  swellSize: true,
  idealSwellPeriod: true,
  waterTemp: true,
  hazards: true,
  crimeLevel: true,
  sharkAttack: true,
  image: true,
  coordinates: true,
  videos: true,
  profileImage: true,
  advertisingPrice: true,
  coffeeShop: true,
  hasSharkAlert: true,
  isHiddenGem: true,
  sheltered: true,
  bestMonthOfYear: true,
  region: {
    select: {
      id: true,
      name: true,
      countryId: true,
      continent: true,
    },
  },
  country: {
    select: {
      id: true,
      name: true,
      continentId: true,
    },
  },
} as const;

/**
 * Get all beaches with relations
 * Use with caution - this can be a large dataset
 */
export async function getAllBeaches(): Promise<BeachWithRelations[]> {
  try {
    const beaches = await prisma.beach.findMany({
      select: standardBeachSelect,
      orderBy: [{ regionId: "asc" }, { name: "asc" }],
    });
    return beaches;
  } catch (error) {
    console.error("Error fetching all beaches:", error);
    throw new Error("Failed to fetch beaches from database");
  }
}

/**
 * Get beaches by region ID
 */
export async function getBeachesByRegion(
  regionId: string
): Promise<BeachWithRelations[]> {
  try {
    const beaches = await prisma.beach.findMany({
      where: { regionId },
      select: standardBeachSelect,
      orderBy: { name: "asc" },
    });
    return beaches;
  } catch (error) {
    console.error(`Error fetching beaches for region ${regionId}:`, error);
    throw new Error("Failed to fetch beaches by region");
  }
}

/**
 * Get beaches by country ID
 */
export async function getBeachesByCountry(
  countryId: string
): Promise<BeachWithRelations[]> {
  try {
    const beaches = await prisma.beach.findMany({
      where: { countryId },
      select: standardBeachSelect,
      orderBy: [{ regionId: "asc" }, { name: "asc" }],
    });
    return beaches;
  } catch (error) {
    console.error(`Error fetching beaches for country ${countryId}:`, error);
    throw new Error("Failed to fetch beaches by country");
  }
}

/**
 * Get a single beach by ID
 */
export async function getBeachById(
  beachId: string
): Promise<BeachWithRelations | null> {
  try {
    const beach = await prisma.beach.findUnique({
      where: { id: beachId },
      select: standardBeachSelect,
    });
    return beach;
  } catch (error) {
    console.error(`Error fetching beach ${beachId}:`, error);
    return null;
  }
}

/**
 * Get a single beach by name
 */
export async function getBeachByName(
  name: string
): Promise<BeachWithRelations | null> {
  try {
    const beach = await prisma.beach.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: standardBeachSelect,
    });
    return beach;
  } catch (error) {
    console.error(`Error fetching beach by name ${name}:`, error);
    return null;
  }
}

/**
 * Search beaches by term (name or location)
 */
export async function searchBeaches(
  term: string,
  options?: {
    regionId?: string;
    limit?: number;
  }
): Promise<BeachWithRelations[]> {
  const { regionId, limit = 10 } = options || {};

  try {
    const whereClause: Prisma.BeachWhereInput = {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
      ],
    };

    if (regionId) {
      whereClause.regionId = regionId;
    }

    const beaches = await prisma.beach.findMany({
      where: whereClause,
      select: standardBeachSelect,
      take: limit,
      orderBy: { name: "asc" },
    });

    return beaches;
  } catch (error) {
    console.error(`Error searching beaches with term "${term}":`, error);
    throw new Error("Failed to search beaches");
  }
}

/**
 * Get beaches with filtering options
 */
export async function getBeachesWithFilters(filters: {
  regionId?: string;
  countryId?: string;
  difficulty?: string[];
  waveType?: string[];
  optimalTide?: string[];
  continent?: string;
}): Promise<BeachWithRelations[]> {
  try {
    const whereClause: Prisma.BeachWhereInput = {};

    if (filters.regionId) {
      whereClause.regionId = filters.regionId;
    }

    if (filters.countryId) {
      whereClause.countryId = filters.countryId;
    }

    if (filters.continent) {
      whereClause.continent = filters.continent;
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      whereClause.difficulty = {
        in: filters.difficulty as any[],
      };
    }

    if (filters.waveType && filters.waveType.length > 0) {
      whereClause.waveType = {
        in: filters.waveType as any[],
      };
    }

    if (filters.optimalTide && filters.optimalTide.length > 0) {
      whereClause.optimalTide = {
        in: filters.optimalTide as any[],
      };
    }

    const beaches = await prisma.beach.findMany({
      where: whereClause,
      select: standardBeachSelect,
      orderBy: [{ regionId: "asc" }, { name: "asc" }],
    });

    return beaches;
  } catch (error) {
    console.error("Error fetching beaches with filters:", error);
    throw new Error("Failed to fetch beaches with filters");
  }
}

/**
 * Get unique regions from beaches
 */
export async function getUniqueRegions(): Promise<Region[]> {
  try {
    const regions = await prisma.region.findMany({
      orderBy: [{ countryId: "asc" }, { name: "asc" }],
      include: {
        country: true,
      },
    });
    return regions;
  } catch (error) {
    console.error("Error fetching regions:", error);
    throw new Error("Failed to fetch regions");
  }
}

/**
 * Get unique countries from beaches
 */
export async function getUniqueCountries(): Promise<Country[]> {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      include: {
        continent: true,
      },
    });
    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw new Error("Failed to fetch countries");
  }
}

/**
 * Get beach count by region
 */
export async function getBeachCountByRegion(): Promise<Record<string, number>> {
  try {
    const counts = await prisma.beach.groupBy({
      by: ["regionId"],
      _count: {
        id: true,
      },
    });

    return counts.reduce(
      (acc, item) => {
        acc[item.regionId] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );
  } catch (error) {
    console.error("Error fetching beach counts:", error);
    throw new Error("Failed to fetch beach counts");
  }
}
