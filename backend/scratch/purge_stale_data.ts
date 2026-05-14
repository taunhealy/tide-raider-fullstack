import { prisma } from '../src/lib/prisma';

async function purgeStaleData() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log(`Purging data older than ${today.toISOString()}...`);

  const deletedForecasts = await prisma.forecast.deleteMany({
    where: {
      date: { lt: today }
    }
  });
  console.log(`Deleted ${deletedForecasts.count} stale forecasts.`);

  const deletedScores = await prisma.beachDailyScore.deleteMany({
    where: {
      date: { lt: today }
    }
  });
  console.log(`Deleted ${deletedScores.count} stale scores.`);

  const deletedChecks = await prisma.alertCheck.deleteMany({
    where: {
      checkedAt: { lt: today }
    }
  });
  console.log(`Deleted ${deletedChecks.count} stale alert checks.`);
}

purgeStaleData().catch(console.error).finally(() => prisma.$disconnect());
