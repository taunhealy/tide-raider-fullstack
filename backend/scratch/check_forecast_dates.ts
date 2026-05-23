import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Western Cape Forecast Dates ===");
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
    },
    select: {
      date: true,
      source: true,
      timeSlot: true
    },
    orderBy: { date: 'asc' }
  });

  console.log(`Total Western Cape forecasts: ${forecasts.length}`);
  const uniqueDates = [...new Set(forecasts.map(f => f.date.toISOString()))];
  console.log("Unique Dates in DB for Western Cape:", uniqueDates);
  
  const bySource = forecasts.reduce((acc: any, f) => {
    const key = `${f.source}-${f.timeSlot}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log("By Source and TimeSlot:", bySource);
}

main().catch(console.error).finally(() => prisma.$disconnect());
