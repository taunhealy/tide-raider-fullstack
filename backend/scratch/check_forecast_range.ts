import { prisma } from '../src/lib/prisma';

async function checkDateRange() {
  const minForecast = await prisma.forecast.aggregate({ _min: { date: true } });
  const maxForecast = await prisma.forecast.aggregate({ _max: { date: true } });
  const countForecast = await prisma.forecast.count();

  console.log('--- Forecast Range ---');
  console.log(`Earliest: ${minForecast._min.date?.toISOString()}`);
  console.log(`Latest:   ${maxForecast._max.date?.toISOString()}`);
  console.log(`Total:    ${countForecast}`);

  const recentForecasts = await prisma.forecast.findMany({
    take: 10,
    orderBy: { date: 'asc' },
    select: { date: true, source: true, regionId: true }
  });
  console.log('\n--- Earliest Forecasts in DB ---');
  recentForecasts.forEach(f => console.log(`${f.date.toISOString()} | ${f.source} | ${f.regionId}`));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todaysForecasts = await prisma.forecast.findMany({
    where: { date: today },
    select: { id: true, source: true, regionId: true, windDirection: true, swellDirection: true, timeSlot: true }
  });
  console.log(`\n--- Forecasts for Today (${today.toISOString()}) ---`);
  todaysForecasts.forEach(f => console.log(`${f.timeSlot} | ${f.source} | Wind: ${f.windDirection} | Swell: ${f.swellDirection}`));
}

checkDateRange().catch(console.error).finally(() => prisma.$disconnect());
