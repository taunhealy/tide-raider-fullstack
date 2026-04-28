import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  const date = new Date('2026-04-28T00:00:00Z');
  const forecasts = await prisma.forecast.findMany({
    where: { regionId: 'western-cape', date },
    select: { source: true, timeSlot: true, tide: true, swellHeight: true, swellPeriod: true, windSpeed: true },
    orderBy: [{ source: 'asc' }, { timeSlot: 'asc' }]
  });
  
  console.log("=== April 28 Forecasts - Tide Field Raw Values ===");
  forecasts.forEach(f => {
    console.log(`[${f.source}/${f.timeSlot}] tide="${f.tide}" | swellHeight=${f.swellHeight}m | swellPeriod=${f.swellPeriod}s | wind=${f.windSpeed}kts`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
