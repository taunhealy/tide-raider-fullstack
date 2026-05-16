import { PrismaClient } from '@prisma/client';
import { fetchArchiveFromOpenMeteo } from '../src/lib/scrapers/openmeteo';

const prisma = new PrismaClient();

async function recoverLogData(logId: string) {
  console.log(`[Recovery] 🚑 Attempting to recover data for log: ${logId}`);
  
  const log = await prisma.logEntry.findUnique({
    where: { id: logId }
  });

  if (!log) {
    console.error('❌ Log not found');
    return;
  }

  if (log.forecastId) {
    console.log('✅ Log already has a forecast link');
    // return;
  }

  const date = new Date(log.date);
  const regionId = log.regionId;
  const slot = log.surfTimeSlot || 'NOON';

  console.log(`[Recovery] 📅 Fetching archive for ${regionId} on ${date.toISOString().split('T')[0]}`);
  
  const archiveData = await fetchArchiveFromOpenMeteo(regionId, date);
  
  if (archiveData.length === 0) {
    console.error('❌ No archive data found for this date/region');
    return;
  }

  console.log(`[Recovery] 📊 Found ${archiveData.length} slots in archive`);

  // Create Forecast records for all slots found
  for (const data of archiveData) {
    try {
      const forecast = await prisma.forecast.upsert({
        where: {
          date_regionId_source_timeSlot: {
            date: date,
            regionId: regionId,
            source: 'OPENMETEO_ARCHIVE',
            timeSlot: data.timeSlot || 'NOON'
          }
        },
        update: {},
        create: {
          date: date,
          regionId: regionId,
          source: 'OPENMETEO_ARCHIVE',
          timeSlot: data.timeSlot || 'NOON',
          windSpeed: Math.round(data.windSpeed),
          windDirection: data.windDirection,
          swellHeight: data.swellHeight,
          swellPeriod: Math.round(data.swellPeriod),
          swellDirection: data.swellDirection
        }
      });

      // If this is the slot the user logged, link it
      if (data.timeSlot === slot) {
        await prisma.logEntry.update({
          where: { id: logId },
          data: { forecastId: forecast.id, mostAccurateSource: 'OPENMETEO_ARCHIVE' }
        });
        console.log(`✅ Log ${logId} successfully linked to new OPENMETEO forecast`);
      }
    } catch (err) {
      console.error(`❌ Failed to create forecast for slot ${data.timeSlot}:`, err);
    }
  }
}

async function recoverAllMissingData() {
  const missingLogs = await prisma.logEntry.findMany({
    where: { forecastId: null },
    orderBy: { date: 'desc' }
  });

  console.log(`[Recovery] 🚀 Found ${missingLogs.length} logs missing forecast data. Starting recovery...`);

  for (const log of missingLogs) {
    await recoverLogData(log.id);
    // Brief delay to be kind to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('[Recovery] ✨ Bulk recovery complete.');
}

recoverAllMissingData()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
  });
