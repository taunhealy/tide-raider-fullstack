import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDateData() {
  const targetDate = new Date("2026-04-22");
  targetDate.setUTCHours(0, 0, 0, 0);

  console.log(`\n🔍 Checking data for: ${targetDate.toISOString()}`);

  const forecasts = await prisma.forecast.count({
    where: { date: targetDate }
  });

  const scores = await prisma.beachDailyScore.count({
    where: { date: targetDate }
  });

  console.log(`Forecast Records: ${forecasts}`);
  console.log(`Score Records: ${scores}`);

  const sampleForecasts = await prisma.forecast.findMany({
    where: { date: targetDate },
    take: 5
  });
  
  console.log("\nSample Forecast Sources:", [...new Set(sampleForecasts.map(f => f.source))]);
}

checkDateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
