import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const date = new Date("2026-05-28");
  
  console.log(`Checking Forecast table for 2026-05-28...`);
  const forecasts = await prisma.forecast.findMany({
    where: {
      date: {
        gte: new Date("2026-05-28T00:00:00Z"),
        lt: new Date("2026-05-29T00:00:00Z")
      }
    }
  });
  console.log(`Found ${forecasts.length} forecasts:`, JSON.stringify(forecasts, null, 2));

  console.log(`Checking BeachDailyScore table for 2026-05-28...`);
  const dailyScores = await prisma.beachDailyScore.findMany({
    where: {
      date: {
        gte: new Date("2026-05-28T00:00:00Z"),
        lt: new Date("2026-05-29T00:00:00Z")
      }
    }
  });
  console.log(`Found ${dailyScores.length} daily scores:`, JSON.stringify(dailyScores, null, 2));
}

main().finally(() => prisma.$disconnect());
