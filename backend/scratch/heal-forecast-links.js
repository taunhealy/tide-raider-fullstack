
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting healing process for log entries...');
  
  const entries = await prisma.logEntry.findMany({
    where: {
      date: {
        gte: new Date('2026-05-01')
      }
    },
    include: {
      forecast: true
    }
  });

  console.log(`Checking ${entries.length} entries...`);
  let fixedCount = 0;

  for (const entry of entries) {
    const logDate = new Date(entry.date);
    logDate.setUTCHours(0, 0, 0, 0);

    const sourceToTry = entry.mostAccurateSource;
    const timeSlotToTry = entry.surfTimeSlot || entry.timeSlot;

    // Check if we need to heal
    const currentSource = entry.forecast?.source;
    const currentTimeSlot = entry.forecast?.timeSlot;

    if (sourceToTry && (currentSource !== sourceToTry || currentTimeSlot !== timeSlotToTry)) {
      // Find the correct one
      const correctForecast = await prisma.forecast.findFirst({
        where: {
          regionId: entry.regionId,
          date: logDate,
          source: sourceToTry,
          timeSlot: timeSlotToTry || undefined
        }
      });

      if (correctForecast && correctForecast.id !== entry.forecastId) {
        await prisma.logEntry.update({
          where: { id: entry.id },
          data: { forecastId: correctForecast.id }
        });
        console.log(`Healed entry ${entry.id} (${entry.beachName}): linked to ${correctForecast.source} ${correctForecast.timeSlot}`);
        fixedCount++;
        continue;
      }
    }

    // Fallback to Source A (WINDFINDER) if null
    if (!entry.forecastId) {
      const fallbackForecast = await prisma.forecast.findFirst({
        where: {
          regionId: entry.regionId,
          date: logDate,
          source: 'WINDFINDER',
          timeSlot: timeSlotToTry || undefined
        }
      });

      if (fallbackForecast) {
        await prisma.logEntry.update({
          where: { id: entry.id },
          data: { forecastId: fallbackForecast.id }
        });
        console.log(`Healed entry ${entry.id} (${entry.beachName}): linked to fallback Source A`);
        fixedCount++;
      } else {
        // Try ANY forecast for the day as a last resort
        const anyForecast = await prisma.forecast.findFirst({
          where: {
            regionId: entry.regionId,
            date: logDate
          },
          orderBy: [
            { source: 'asc' },
            { timeSlot: 'asc' }
          ]
        });

        if (anyForecast) {
          await prisma.logEntry.update({
            where: { id: entry.id },
            data: { forecastId: anyForecast.id }
          });
          console.log(`Healed entry ${entry.id} (${entry.beachName}): linked to random fallback`);
          fixedCount++;
        }
      }
    }
  }

  console.log(`Healing complete. Fixed ${fixedCount} entries.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
