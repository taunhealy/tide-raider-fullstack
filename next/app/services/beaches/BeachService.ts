import { prisma } from "@/app/lib/prisma";
import { ForecastService } from "../forecasts/ForecastService";
import { ScoreService } from "../scores/ScoreService";
import { getLatestConditions } from "@/app/api/surf-conditions/route";
import { FILTERS } from "@/app/config/filters";
import {
  Season,
  Prisma,
  OptimalTide,
  WaveType,
  CrimeLevel,
  Difficulty,
  Hazard,
} from "@prisma/client";
import type { FilterConfig } from "@/app/types/filters";
import type { Beach, Region } from "@/app/types/beaches";
import type { BeachInitialData } from "@/app/types/beaches";
import type { ForecastData } from "@/app/types/forecast";

interface FilterParams {
  regionId?: string;
  date?: Date;
  searchQuery?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

//The service acts as the translation layer between the front-end and the back-end.
//It takes the filters from the front-end, translates them into the format expected by the back-end,
//and then calls the back-end to get the beaches.
//It also takes the beaches from the back-end, translates them into the format expected by the front-end,
//and then returns them to the front-end.

export class BeachService {
  static async getFilteredBeaches(searchParams: URLSearchParams) {
    // Directly call database instead of HTTP fetch to avoid URL issues in server components
    const regionId = searchParams.get("regionId")?.toLowerCase();
    const searchQuery = searchParams.get("searchQuery");

    console.log(`[BeachService] Request received for regionId: ${regionId}`);

    if (!regionId) {
      throw new Error("regionId is required");
    }

    try {
      // Handle array parameters properly
      const crimeLevelParam = searchParams.get("crimeLevel");
      const crimeLevels = crimeLevelParam
        ? (crimeLevelParam.split(",") as CrimeLevel[])
        : undefined;

      const whereClause = {
        regionId,
        ...(searchQuery && {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              location: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }),
        ...(searchParams.get("optimalTide") && {
          optimalTide: searchParams.get("optimalTide") as OptimalTide,
        }),
        ...(searchParams.get("waveType") && {
          waveType: searchParams.get("waveType") as WaveType,
        }),
        ...(crimeLevels && {
          crimeLevel: {
            in: crimeLevels,
          },
        }),
        ...(searchParams.get("bestSeasons") && {
          bestSeasons: {
            hasSome: searchParams.get("bestSeasons")?.split(",") as Season[],
          },
        }),
        ...(searchParams.get("difficulty") && {
          difficulty: searchParams.get("difficulty") as Difficulty,
        }),
        ...(searchParams.get("hazards") && {
          hazards: {
            hasSome: searchParams.get("hazards")?.split(",") as Hazard[],
          },
        }),
      };

      // Get current date at midnight UTC
      const currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);

      // Step 1: Get or fetch forecast data
      let forecast = await prisma.forecastA.findFirst({
        where: {
          regionId,
          date: currentDate,
        },
        select: {
          windSpeed: true,
          windDirection: true,
          swellHeight: true,
          swellPeriod: true,
          swellDirection: true,
          date: true,
        },
      });

      // If no forecast exists, try to fetch it
      if (!forecast) {
        try {
          const fetchedForecast = await getLatestConditions(false, regionId);
          if (fetchedForecast) {
            forecast = {
              windSpeed: fetchedForecast.windSpeed,
              windDirection: fetchedForecast.windDirection,
              swellHeight: fetchedForecast.swellHeight,
              swellPeriod: fetchedForecast.swellPeriod,
              swellDirection: fetchedForecast.swellDirection,
              date: currentDate,
            };
          }
        } catch (error) {
          console.error("Failed to fetch forecast:", error);
        }
      }

      // Step 2: Check if scores exist for today
      const existingScores = await prisma.beachDailyScore.count({
        where: {
          regionId,
          date: currentDate,
        },
      });

      // Also check if all existing scores are 0 (which might indicate they need recalculation)
      const existingScoresData = await prisma.beachDailyScore.findMany({
        where: {
          regionId,
          date: currentDate,
        },
        select: {
          score: true,
          beachId: true,
        },
        take: 5, // Sample first 5
      });

      const allScoresZero =
        existingScoresData.length > 0 &&
        existingScoresData.every((s) => s.score === 0);

      // Step 3: Calculate scores if they don't exist OR if all scores are 0 (recalculate)
      if ((existingScores === 0 || allScoresZero) && forecast) {
        console.log(
          `${existingScores === 0 ? "Calculating" : "Recalculating"} scores for ${regionId} on ${currentDate.toISOString().split("T")[0]}...`
        );
        try {
          await ScoreService.calculateAndStoreScores(regionId, {
            ...forecast,
            date: currentDate,
          });
          console.log("✓ Scores calculated and stored");
        } catch (error) {
          console.error("Failed to calculate scores:", error);
        }
      }

      // Step 4: Fetch beaches with their daily scores (now guaranteed to exist)
      const beaches = await prisma.beach.findMany({
        where: whereClause,
        include: {
          region: true,
          beachDailyScores: {
            where: { date: currentDate },
            // Include all fields to match BeachDailyScore type
          },
        },
      });

      console.log(`Fetched ${beaches.length} beaches for ${regionId}`);

      // Transform scores into a flat dictionary, ensuring the full beach object is included.
      // Also ensure region has regionId property to match Region type
      const scores: BeachInitialData["scores"] = beaches.reduce(
        (acc, beach) => {
          const dailyScore =
            beach.beachDailyScores.length > 0
              ? beach.beachDailyScores[0]
              : null;

          // Transform region to include regionId property
          const transformedRegion: Region | null = beach.region
            ? {
                ...beach.region,
                regionId: beach.region.id, // Add regionId to match Region type
                continent: beach.region.continent ?? undefined, // Convert null to undefined
              }
            : null;

          acc[beach.id] = {
            score: dailyScore?.score ?? 0,
            beach: {
              ...beach,
              region: transformedRegion,
              beachDailyScores: dailyScore ? [dailyScore] : [],
            } as unknown as Beach & {
              region: Region;
              beachDailyScores: typeof beach.beachDailyScores;
            },
          };
          return acc;
        },
        {} as BeachInitialData["scores"]
      );

      // Return transformed data structure matching API response format
      // Transform beaches array to include regionId in region
      const transformedBeaches: Beach[] = beaches.map((beach) => {
        const { beachDailyScores, ...beachData } = beach;
        return {
          ...beachData,
          region: beach.region
            ? {
                ...beach.region,
                regionId: beach.region.id, // Add regionId to match Region type
                continent: beach.region.continent ?? undefined, // Convert null to undefined
              }
            : undefined,
        } as unknown as Beach;
      });

      return {
        beaches: transformedBeaches,
        scores,
        forecast,
        totalCount: beaches.length,
      } as BeachInitialData;
    } catch (error) {
      console.error("Error in getFilteredBeaches:", error);
      throw error;
    }
  }

  private static parseFilters(searchParams: URLSearchParams): FilterParams {
    const filters: FilterParams = {
      regionId: searchParams.get("regionId")?.toLowerCase(),
      date: searchParams.get("date")
        ? new Date(searchParams.get("date")!)
        : undefined,
      searchQuery: searchParams.get("searchQuery") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    // Parse additional filters from FILTERS config
    FILTERS.forEach((filter: FilterConfig) => {
      const value = searchParams.get(filter.urlParam);
      if (value) {
        switch (filter.type) {
          case "array":
            filters[filter.beachProp] = value.split(",");
            break;
          case "boolean":
            filters[filter.beachProp] = value === "true";
            break;
          case "number":
            filters[filter.beachProp] = parseFloat(value);
            break;
          default:
            filters[filter.beachProp] = value;
        }
      }
    });

    return filters;
  }

  private static buildPrismaFilters(filters: FilterParams) {
    const prismaFilters: Record<string, any> = {};

    FILTERS.forEach((filter: FilterConfig) => {
      const value = filters[filter.beachProp];
      if (value !== undefined) {
        switch (filter.type) {
          case "array":
            // Handle enum case conversion for specific fields
            if (
              ["bestSeasons", "waveType", "difficulty", "crimeLevel"].includes(
                filter.beachProp
              )
            ) {
              prismaFilters[filter.beachProp] = {
                in: Array.isArray(value)
                  ? value.map((v) => v.toUpperCase())
                  : [value.toUpperCase()],
              };
            } else {
              prismaFilters[filter.beachProp] = { in: value };
            }
            break;
          case "boolean":
            prismaFilters[filter.beachProp] = value;
            break;
          case "number":
            prismaFilters[filter.beachProp] = { gte: value };
            break;
          default:
            prismaFilters[filter.beachProp] = value;
        }
      }
    });

    return prismaFilters;
  }

  private static async ensureScores(
    regionId: string,
    date: Date,
    forecast: any
  ) {
    const existingScores = await prisma.beachDailyScore.findMany({
      where: { regionId, date },
    });

    if (
      existingScores.length === 0 ||
      existingScores.every((s) => s.score === 0)
    ) {
      await ScoreService.calculateAndStoreScores(regionId, {
        ...forecast,
        date,
      });
    }
  }
}
