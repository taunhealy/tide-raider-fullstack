import { prisma } from "@/app/lib/prisma";
import { ForecastService } from "../forecasts/ForecastService";
import { ScoreService } from "../scores/ScoreService";
import { FILTERS } from "@/app/config/filters";
import type { FilterConfig } from "@/app/types/filters";
import type { Beach } from "@/app/types/beaches";
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
    // In server components, use environment variable or construct URL properly
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    typeof window !== "undefined" ? window.location.origin :
                    "http://localhost:3000";
    
    try {
      const response = await fetch(
        `${baseUrl}/api/filtered-beaches?${searchParams.toString()}`,
        {
          // Add cache headers for server-side requests
          cache: 'no-store',
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch filtered beaches:", response.status, errorText);
        throw new Error(`Failed to fetch filtered beaches: ${response.status}`);
      }
      return response.json();
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
