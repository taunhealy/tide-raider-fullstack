import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beachId = 'llandudno';
  const beach = await prisma.beach.findUnique({ where: { id: beachId } });
  
  if (!beach) {
    console.error('Beach not found');
    return;
  }

  const windyForecasts = await prisma.forecast.findMany({
    where: {
      regionId: beach.regionId,
      source: "WINDY",
      date: {
        gte: new Date('2026-05-08T00:00:00Z')
      }
    },
    take: 5
  });

  console.log('Windy Data Found:', windyForecasts.length);
  if (windyForecasts.length > 0) {
    console.log('Sample Swell 2:', windyForecasts[0].swellHeight2);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
