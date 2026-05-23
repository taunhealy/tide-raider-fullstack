import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Forecast Database Count ===");
  const count = await prisma.forecast.count();
  console.log("Total forecasts in DB:", count);

  const sources = await prisma.forecast.groupBy({
    by: ['source'],
    _count: true
  });
  console.log("Forecasts by source:", sources);

  const regions = await prisma.forecast.groupBy({
    by: ['regionId'],
    _count: true
  });
  console.log("Forecasts by region:", regions);

  const dates = await prisma.forecast.aggregate({
    _min: { date: true },
    _max: { date: true }
  });
  console.log("Date range in DB:", dates);
}

main().catch(console.error).finally(() => prisma.$disconnect());
