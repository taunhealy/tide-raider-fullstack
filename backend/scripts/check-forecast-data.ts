/**
 * Check if forecast data exists in the database for a specific date
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkForecastData() {
  try {
    const testDate = new Date("2025-12-06");
    testDate.setUTCHours(0, 0, 0, 0);
    const dateStr = testDate.toISOString().split("T")[0];

    console.log(`🔍 Checking forecast data for: ${dateStr}\n`);

    // Check all sources for western-cape
    const regionId = "western-cape";
    const sources = ["WINDFINDER", "WINDGURU", "WINDY"] as const;

    for (const source of sources) {
      const forecast = await prisma.forecast.findUnique({
        where: {
          date_regionId_source: {
            date: testDate,
            regionId: regionId,
            source: source,
          },
        },
      });

      if (forecast) {
        console.log(`✅ ${source}: Found forecast`);
        console.log(`   Date: ${forecast.date.toISOString().split("T")[0]}`);
        console.log(`   Region: ${forecast.regionId}`);
        console.log(`   Wind Speed: ${forecast.windSpeed} km/h`);
        console.log(`   Wind Direction: ${forecast.windDirection}°`);
        console.log(`   Temperature: ${forecast.temperature}°C\n`);
      } else {
        console.log(`❌ ${source}: No forecast found\n`);
      }
    }

    // Check if region exists
    const region = await prisma.region.findUnique({
      where: { id: regionId },
      select: { id: true, name: true },
    });

    console.log(`\n📍 Region check:`);
    if (region) {
      console.log(`✅ Region exists: ${region.id} (${region.name})`);
    } else {
      console.log(`❌ Region not found: ${regionId}`);
    }

    // Check recent forecasts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const recentForecasts = await prisma.forecast.findMany({
      where: {
        regionId: regionId,
        date: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        date: true,
        source: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    console.log(`\n📊 Recent forecasts (last 7 days):`);
    if (recentForecasts.length === 0) {
      console.log(`   No forecasts found in the last 7 days`);
    } else {
      const grouped = recentForecasts.reduce((acc, f) => {
        const dateStr = f.date.toISOString().split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(f.source);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(grouped).forEach(([date, sources]) => {
        console.log(`   ${date}: ${sources.join(", ")}`);
      });
    }

  } catch (error) {
    console.error("❌ Error checking forecast data:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkForecastData()
  .then(() => {
    console.log("\n✨ Check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });

