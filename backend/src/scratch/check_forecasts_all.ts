import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
      date: new Date('2026-05-14T00:00:00Z')
    },
    orderBy: [
      { timeSlot: 'asc' },
      { source: 'asc' }
    ]
  });
  console.log(forecasts.map(f => ({
    source: f.source,
    slot: f.timeSlot,
    wind: f.windSpeed,
    updatedAt: f.updatedAt
  })));
}

main().finally(() => prisma.$disconnect());
