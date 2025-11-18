import { ForecastProperty } from "@/app/types/alerts";
import { prisma } from "./prisma";
import { Forecast } from "@prisma/client";

export async function checkAlertConditions(alertId: string) {
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

  // Use the structured forecast data
  const forecast = await prisma.forecast.findFirst({
    where: {
      regionId: alert.regionId,
      date: alert.forecastDate,
      source: "WINDFINDER", // Prefer WINDFINDER source
    },
  });

  if (!forecast) return false;

  // Check if all conditions are met
  return alert.properties?.every((condition) => {
    const forecastValue = forecast[condition.property as keyof Forecast];
    return (
      typeof forecastValue === "number" && forecastValue >= condition.range
    );
  });
}
