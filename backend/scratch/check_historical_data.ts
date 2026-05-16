
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Forecasts for April 13 ---');
  const forecasts = await prisma.forecast.findMany({
    where: {
      date: new Date('2026-04-13')
    }
  });
  console.log(`Found ${forecasts.length} forecasts for April 13.`);

  console.log('--- Checking BeachDailyScores for April 13 ---');
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      date: new Date('2026-04-13')
    }
  });
  console.log(`Found ${scores.length} scores for April 13.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
