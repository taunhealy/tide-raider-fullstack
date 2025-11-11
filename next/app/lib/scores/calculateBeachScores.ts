import type { Beach } from "@prisma/client";
import type { BeachScoreMap } from "@/app/types/scores";
import type { ForecastA } from "@prisma/client";
import type { Region } from "@prisma/client";

export function calculateBeachScores({
  beaches,
  forecast,
  region,
  dailyScores,
}: {
  beaches: Beach[];
  forecast: ForecastA;
  region: Region;
  dailyScores: Array<{ beachId: string; score: number }>;
}): BeachScoreMap {
  return Object.fromEntries(
    beaches.map((beach) => [
      beach.id,
      {
        score: dailyScores.find((s) => s.beachId === beach.id)?.score ?? 0,
        beach: {
          beachDailyScores: [
            {
              date: forecast.date.toISOString(),
              conditions: {
                windSpeed: forecast.windSpeed,
                windDirection: forecast.windDirection,
                swellHeight: forecast.swellHeight,
                swellDirection: forecast.swellDirection,
                swellPeriod: forecast.swellPeriod,
              },
            },
          ],
        },
      },
    ])
  );
}
