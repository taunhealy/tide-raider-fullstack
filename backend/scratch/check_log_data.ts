import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLogData() {
  const logId = "82b18aa8-9788-49ac-88f4-90ee53d6922e";
  console.log(`Checking data for log: ${logId}`);

  const logEntry = await prisma.logEntry.findUnique({
    where: { id: logId },
    include: { beach: true }
  });

  if (!logEntry) {
    console.error("Log entry not found!");
    return;
  }

  console.log("Log Entry found:");
  console.log({
    id: logEntry.id,
    date: logEntry.date,
    beachId: logEntry.beachId,
    beachName: logEntry.beach?.name,
    surfTimeSlot: logEntry.surfTimeSlot,
    mostAccurateSource: logEntry.mostAccurateSource
  });

  const targetDate = new Date(logEntry.date);
  targetDate.setUTCHours(0, 0, 0, 0);

  console.log(`Searching for BeachDailyScore for beach ${logEntry.beachId} on ${targetDate.toISOString().split('T')[0]}`);

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: logEntry.beachId as string,
      date: targetDate
    }
  });

  console.log(`Found ${scores.length} scores:`);
  scores.forEach(s => {
    console.log(`- Source: ${s.source}, TimeSlot: ${s.timeSlot}, Score: ${s.score}`);
  });

  if (scores.length === 0) {
      console.log("Searching for Forecasts as fallback...");
      const forecasts = await prisma.forecast.findMany({
          where: {
              regionId: logEntry.beach?.regionId,
              date: targetDate
          }
      });
      console.log(`Found ${forecasts.length} forecasts for region ${logEntry.beach?.regionId}`);
      forecasts.forEach(f => {
          console.log(`- Source: ${f.source}, TimeSlot: ${f.timeSlot}`);
      });
  }
}

checkLogData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
