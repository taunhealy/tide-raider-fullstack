import { prisma } from '../src/lib/prisma';

async function checkDates() {
  console.log('--- Forecast Dates ---');
  const forecastDates = await prisma.forecast.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'asc' },
  });
  forecastDates.forEach(f => console.log(f.date.toISOString()));

  console.log('\n--- BeachDailyScore Dates ---');
  const scoreDates = await prisma.beachDailyScore.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'asc' },
  });
  scoreDates.forEach(s => console.log(s.date.toISOString()));

  console.log('\n--- Recent AlertNotifications ---');
  const recentNotifs = await prisma.alertNotification.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, details: true }
  });
  recentNotifs.forEach(n => {
    const dateMatch = n.details?.match(/Date:<\/div><div class="data-value">(.*?)<\/div>/);
    console.log(`ID: ${n.id}, CreatedAt: ${n.createdAt.toISOString()}, NotifDate: ${dateMatch ? dateMatch[1] : 'unknown'}`);
  });
}

checkDates().catch(console.error).finally(() => prisma.$disconnect());
