import { prisma } from "@/app/lib/prisma";
import { CoreForecastData } from "@/app/types/forecast";
import { getLatestConditions } from "@/app/api/surf-conditions/route";

export class ForecastService {
  static async getOrCreateForecast(
    regionId: string
  ): Promise<CoreForecastData> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let forecast = await prisma.forecastA.findFirst({
      where: {
        date: today,
        regionId,
      },
    });

    if (!forecast) {
      const newForecast = await getLatestConditions(true, regionId);
      forecast = await prisma.forecastA.findFirst({
        where: { id: newForecast.id },
      });
    }

    if (!forecast) {
      throw new Error(`No forecast available for region ${regionId}`);
    }

    return forecast;
  }
}
