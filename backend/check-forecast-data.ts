// Quick script to check forecast data in the database
// Run with: npx tsx check-forecast-data.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkForecastData() {
  try {
    console.log("🔍 Checking forecast data for log entries...\n");

    // 1. Count log entries with/without forecastId
    const totalLogs = await prisma.logEntry.count();
    const logsWithForecast = await prisma.logEntry.count({
      where: {
        forecastId: { not: null },
      },
    });

    console.log(`Total log entries: ${totalLogs}`);
    console.log(`Logs with forecastId: ${logsWithForecast}`);
    console.log(`Logs without forecastId: ${totalLogs - logsWithForecast}\n`);

    // 2. Get recent log entries with forecast data
    const recentLogs = await prisma.logEntry.findMany({
      take: 10,
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        beachName: true,
        surferRating: true,
        forecastId: true,
        forecast: {
          select: {
            id: true,
            windSpeed: true,
            windDirection: true,
            swellHeight: true,
            swellPeriod: true,
            swellDirection: true,
          },
        },
      },
    });

    console.log("📊 Recent log entries with forecast data:\n");
    recentLogs.forEach((log) => {
      const hasForecast = !!log.forecast;
      const hasData =
        hasForecast &&
        (log.forecast!.windSpeed !== null ||
          log.forecast!.windDirection !== null ||
          log.forecast!.swellHeight !== null ||
          log.forecast!.swellPeriod !== null ||
          log.forecast!.swellDirection !== null);

      console.log(`Log ID: ${log.id}`);
      console.log(`  Date: ${log.date}`);
      console.log(`  Beach: ${log.beachName || "N/A"}`);
      console.log(`  Rating: ${log.surferRating}`);
      console.log(`  ForecastId: ${log.forecastId || "NULL"}`);
      if (hasForecast) {
        console.log(`  Forecast Data:`);
        console.log(`    Wind Speed: ${log.forecast!.windSpeed ?? "NULL"}`);
        console.log(
          `    Wind Direction: ${log.forecast!.windDirection ?? "NULL"}`
        );
        console.log(`    Swell Height: ${log.forecast!.swellHeight ?? "NULL"}`);
        console.log(`    Swell Period: ${log.forecast!.swellPeriod ?? "NULL"}`);
        console.log(
          `    Swell Direction: ${log.forecast!.swellDirection ?? "NULL"}`
        );
        console.log(
          `  Status: ${hasData ? "✅ Has data" : "❌ All null values"}`
        );
      } else {
        console.log(`  Status: ❌ No forecast linked`);
      }
      console.log("");
    });

    // 3. Check for forecasts with all null values
    const emptyForecasts = await prisma.forecast.findMany({
      where: {
        windSpeed: null,
        windDirection: null,
        swellHeight: null,
        swellPeriod: null,
        swellDirection: null,
      },
      take: 5,
    });

    console.log(
      `\n⚠️  Forecasts with all null values: ${emptyForecasts.length}`
    );
    if (emptyForecasts.length > 0) {
      console.log("These forecasts won't display in the UI.\n");
    }
  } catch (error) {
    console.error("❌ Error checking forecast data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForecastData();
