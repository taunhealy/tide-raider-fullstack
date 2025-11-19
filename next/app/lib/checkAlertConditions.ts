import { ForecastProperty } from "@/app/types/alerts";
import { CoreForecastData } from "@/app/types/forecast";

// Forecast type matching the database schema
type Forecast = CoreForecastData & {
  source?: "WINDFINDER" | "WINDGURU" | "WINDY";
  [key: string]: any;
};

/**
 * Check if alert conditions are met
 * @deprecated This function uses Prisma directly. Consider migrating to backend API.
 */
export async function checkAlertConditions(alertId: string) {
  // This function is not currently used in the codebase
  // If needed, migrate to use backend API: /api/alerts/:id/check
  console.warn(
    "checkAlertConditions: This function uses Prisma and should be migrated to backend API"
  );
  return false;

  /* Original implementation (requires Prisma):
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      logEntry: {
        include: { forecast: true },
      },
      properties: true,
    },
  });

  if (!alert) return false;

  const forecast = await prisma.forecast.findFirst({
    where: {
      regionId: alert.regionId,
      date: alert.forecastDate,
      source: "WINDFINDER",
    },
  });

  if (!forecast) return false;

  return alert.properties?.every((condition) => {
    const forecastValue = forecast[condition.property as keyof Forecast];
    return (
      typeof forecastValue === "number" && forecastValue >= condition.range
    );
  });
  */
}
