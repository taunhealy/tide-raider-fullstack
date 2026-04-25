const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function healLogs() {
  console.log('--- Starting Log Healing Process ---');
  try {
    // 1. Fetch logs with missing forecastId
    const logs = await prisma.logEntry.findMany({
      where: {
        forecastId: null
      }
    });

    console.log(`Found ${logs.length} logs with missing conditions.`);

    let healedCount = 0;
    let skippedCount = 0;

    for (const log of logs) {
      // 2. Try to find a matching forecast
      // We look for a forecast in the same region on the same date
      // We prefer MORNING timeSlot and WINDFINDER source if possible
      const logDate = new Date(log.date);
      logDate.setUTCHours(0, 0, 0, 0);

      const forecast = await prisma.forecast.findFirst({
        where: {
          regionId: log.regionId,
          date: logDate,
        },
        orderBy: [
          { source: 'asc' }, // Alphabetical source priority (e.g. WINDFINDER vs others)
          { timeSlot: 'asc' } // MORNING usually comes first alphabetically or by enum order
        ]
      });

      if (forecast) {
        // 3. Link them up
        await prisma.logEntry.update({
          where: { id: log.id },
          data: { forecastId: forecast.id }
        });
        console.log(`✅ Healed: Log ${log.id} (${log.beachName || 'Unnamed'}) linked to forecast ${forecast.id}`);
        healedCount++;
      } else {
        console.log(`❌ No forecast found for: Log ${log.id} (${log.beachName || 'Unnamed'}) - Date: ${log.date.toISOString().split('T')[0]}, Region: ${log.regionId}`);
        skippedCount++;
      }
    }

    console.log('\n--- Healing Complete ---');
    console.log(`Healed: ${healedCount}`);
    console.log(`Skipped (No match found): ${skippedCount}`);

  } catch (error) {
    console.error('Error during healing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

healLogs();
