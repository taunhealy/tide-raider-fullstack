import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tomorrow = new Date('2026-04-28T00:00:00Z');
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
      date: tomorrow,
    }
  });

  console.log("Forecasts for tomorrow (Western Cape):", JSON.stringify(forecasts, null, 2));

  // Find long beach id
  const longBeach = await prisma.beach.findFirst({
    where: { name: { contains: "Long Beach" } }
  });
  console.log("Long Beach:", longBeach?.id);

  if (longBeach) {
    const scores = await prisma.beachDailyScore.findMany({
      where: {
        beachId: longBeach.id,
        date: tomorrow
      }
    });
    console.log("Scores for Long Beach tomorrow:", JSON.stringify(scores, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
