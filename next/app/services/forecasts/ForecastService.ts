import { CoreForecastData } from "@/app/types/forecast";
import { getLatestConditions } from "@/app/lib/forecast-utils";

/**
 * @deprecated This service uses Prisma directly. Use getLatestConditions from forecast-utils instead,
 * or call the backend API directly via api.getForecast().
 */
export class ForecastService {
  static async getOrCreateForecast(
    regionId: string
  ): Promise<CoreForecastData> {
    // Use the backend API via getLatestConditions
    // This will fetch from the backend, which handles caching and scraping
    const forecast = await getLatestConditions(false, regionId);

    if (!forecast) {
      throw new Error(`No forecast available for region ${regionId}`);
    }

    return forecast;
  }
}
