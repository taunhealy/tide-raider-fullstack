import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logId = "70fc2561-b9dc-4057-a395-251444c792d6";
  const log = await prisma.logEntry.findUnique({ where: { id: logId } });
  
  if (!log) {
    console.log("Log not found");
    return;
  }

  const date = log.date;
  const regionId = log.regionId;
  const slot = "NOON";

  const forecast = await prisma.forecast.upsert({
    where: {
      date_regionId_source_timeSlot: {
        date: date,
        regionId: regionId,
        source: 'WINDFINDER',
        timeSlot: slot
      }
    },
    update: {},
    create: {
      date: date,
      regionId: regionId,
      source: 'WINDFINDER',
      timeSlot: slot,
      windSpeed: 10,
      windDirection: 180,
      swellHeight: 1.5,
      swellPeriod: 12,
      swellDirection: 200,
      tide: 'LOW'
    }
  });

  await prisma.logEntry.update({
    where: { id: logId },
    data: { 
      forecastId: forecast.id, 
      surfTimeSlot: slot,
      mostAccurateSource: 'WINDFINDER'
    }
  });
  
  console.log("Successfully attached forecast to log entry!");
}

main().finally(() => prisma.$disconnect());
