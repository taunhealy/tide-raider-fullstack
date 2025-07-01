import { prisma } from "@/app/lib/prisma";
import { ForecastService } from "../forecasts/ForecastService";
import { ScoreService } from "../scores/ScoreService";
import { FILTERS } from "@/app/config/filters";
import type { FilterConfig } from "@/app/config/filters";
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

export class BeachService {
  static async getFilteredBeaches(
    searchParams: URLSearchParams
  ): Promise<BeachInitialData> {
    const filters = this.parseFilters(searchParams);

    if (!filters.regionId) {
      throw new Error("regionId is required");
    }

    const targetDate = filters.date || new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    // Get or create forecast
    const forecast = await ForecastService.getOrCreateForecast(
      filters.regionId
    );

    // Ensure scores exist
    await this.ensureScores(filters.regionId, targetDate, forecast);

    // Get beaches with scores
    const result = await ScoreService.getBeachesWithScores({
      regionId: filters.regionId,
      date: targetDate,
      searchQuery: filters.searchQuery,
      filters: this.buildPrismaFilters(filters),
    });

    return {
      scores: result.scores as BeachInitialData["scores"],
      beaches: result.beaches as unknown as Beach[],
      forecast: forecast as ForecastData,
      totalCount: result.totalCount,
    };
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
            prismaFilters[filter.beachProp] = { in: value };
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
