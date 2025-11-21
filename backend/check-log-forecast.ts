// Script to check forecast data for a specific log entry
// Run with: npx tsx check-log-forecast.ts <logEntryId>

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLogForecast(logEntryId: string) {
  try {
    console.log(`🔍 Checking forecast for log entry: ${logEntryId}\n`);

    // Get the log entry with forecast
    const logEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
      select: {
        id: true,
        date: true,
        beachName: true,
        surferRating: true,
        forecastId: true,
        regionId: true,
        forecast: {
          select: {
            id: true,
            date: true,
            regionId: true,
            source: true,
            windSpeed: true,
            windDirection: true,
            swellHeight: true,
            swellPeriod: true,
            swellDirection: true,
          },
        },
      },
    });

    if (!logEntry) {
      console.log(`❌ Log entry not found: ${logEntryId}`);
      return;
    }

    console.log("📊 Log Entry Data:");
    console.log(`  ID: ${logEntry.id}`);
    console.log(`  Date: ${logEntry.date}`);
    console.log(`  Beach: ${logEntry.beachName || "N/A"}`);
    console.log(`  Rating: ${logEntry.surferRating}`);
    console.log(`  Region ID: ${logEntry.regionId}`);
    console.log(`  Forecast ID: ${logEntry.forecastId || "NULL"}\n`);

    if (logEntry.forecast) {
      console.log("✅ Forecast Found:");
      console.log(`  Forecast ID: ${logEntry.forecast.id}`);
      console.log(`  Date: ${logEntry.forecast.date}`);
      console.log(`  Region ID: ${logEntry.forecast.regionId}`);
      console.log(`  Source: ${logEntry.forecast.source}`);
      console.log(`  Wind Speed: ${logEntry.forecast.windSpeed}`);
      console.log(`  Wind Direction: ${logEntry.forecast.windDirection}`);
      console.log(`  Swell Height: ${logEntry.forecast.swellHeight}`);
      console.log(`  Swell Period: ${logEntry.forecast.swellPeriod}`);
      console.log(`  Swell Direction: ${logEntry.forecast.swellDirection}\n`);

      // Verify the forecastId matches
      if (logEntry.forecastId === logEntry.forecast.id) {
        console.log("✅ Forecast ID matches - relationship is correct");
      } else {
        console.log(
          "⚠️  WARNING: Forecast ID mismatch!",
          `Expected: ${logEntry.forecastId}, Got: ${logEntry.forecast.id}`
        );
      }
    } else {
      console.log("❌ No forecast linked to this log entry");
      console.log(
        `  Forecast ID in log entry: ${logEntry.forecastId || "NULL"}\n`
      );

      // Check if forecast exists but isn't linked
      if (logEntry.forecastId) {
        const forecastExists = await prisma.forecast.findUnique({
          where: { id: logEntry.forecastId },
        });
        if (forecastExists) {
          console.log(
            "⚠️  Forecast exists in database but relation is broken!"
          );
          console.log(`  Forecast ID: ${forecastExists.id}`);
        } else {
          console.log(
            "⚠️  Forecast ID exists in log entry but forecast doesn't exist in database!"
          );
        }
      }

      // Check if there's a forecast for this date/region
      const possibleForecast = await prisma.forecast.findFirst({
        where: {
          regionId: logEntry.regionId,
          date: logEntry.date,
          source: "WINDFINDER",
        },
      });

      if (possibleForecast) {
        console.log(
          "\n💡 Found a forecast for this date/region that could be linked:"
        );
        console.log(`  Forecast ID: ${possibleForecast.id}`);
        console.log(`  Date: ${possibleForecast.date}`);
        console.log(`  Wind Speed: ${possibleForecast.windSpeed}`);
        console.log(`  Swell Height: ${possibleForecast.swellHeight}`);
      } else {
        console.log("\n💡 No forecast found for this date/region combination");
      }
    }
  } catch (error) {
    console.error("❌ Error checking log forecast:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get log entry ID from command line argument
const logEntryId = process.argv[2];

if (!logEntryId) {
  console.error("❌ Please provide a log entry ID");
  console.log("Usage: npx tsx check-log-forecast.ts <logEntryId>");
  process.exit(1);
}

checkLogForecast(logEntryId);
