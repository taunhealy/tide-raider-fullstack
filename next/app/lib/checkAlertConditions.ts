import { ForecastProperty } from "@/app/types/alerts";
import { prisma } from "./prisma";
import { ForecastA } from "@prisma/client";

export async function checkAlertConditions(alertId: string) {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      logEntry: {
        include: { forecast: true },
      },
    },
  });

  if (!alert) return false;

  // Use the structured forecast data
  const forecast = await prisma.forecastA.findFirst({
    where: {
      region: alert.region,
      date: alert.forecastDate,
    },
  });

  if (!forecast) return false;

  // Check if all conditions are met
  return (
    alert.properties as Array<{ property: string; range: number }>
  )?.every((condition) => {
    const forecastValue = forecast[condition.property as keyof ForecastA];
    return (
      typeof forecastValue === "number" && forecastValue >= condition.range
    );
  });
}
