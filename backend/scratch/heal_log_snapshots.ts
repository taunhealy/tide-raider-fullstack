import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🩹 Starting data healing script for historical LogEntries...");

  try {
    // Fetch all logs that are linked to a forecast
    const logs = await prisma.logEntry.findMany({
      where: {
        forecastId: { not: null }
      },
      include: {
        forecast: true
      }
    });

    // Filter in JS to find ones where forecastSnapshot is missing or empty
    const logsToHeal = logs.filter(log => !log.forecastSnapshot);

    console.log(`🔍 Found ${logsToHeal.length} log entries that require forecastSnapshot backfilling.`);

    let healedCount = 0;
    for (const log of logsToHeal) {
      if (log.forecast) {
        const snapshot = {
          windSpeed: log.forecast.windSpeed,
          windDirection: log.forecast.windDirection,
          swellHeight: log.forecast.swellHeight,
          swellPeriod: log.forecast.swellPeriod,
          swellDirection: log.forecast.swellDirection,
          tide: (log.forecast as any).tide || "",
          source: log.forecast.source || "WINDFINDER"
        };

        await prisma.logEntry.update({
          where: { id: log.id },
          data: {
            forecastSnapshot: snapshot
          }
        });
        healedCount++;
      }
    }

    console.log(`🎉 Successfully backfilled forecastSnapshot for ${healedCount} log entries!`);
  } catch (error) {
    console.error("❌ Error running data healing script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
