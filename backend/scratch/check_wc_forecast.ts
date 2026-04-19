import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const results = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
      date: {
        gte: today,
      },
    },
    orderBy: [
      { date: 'asc' },
      { timeSlot: 'asc' },
    ],
  });

  console.log('--- Western Cape Forecast Data Check ---');
  if (results.length === 0) {
    console.log('No forecast data found for today or future.');
  }

  results.forEach((r) => {
    console.log(
      `[${r.date.toISOString().split('T')[0]}] [${r.timeSlot.padEnd(8)}] ${r.source.padEnd(
        10
      )} | Wind: ${r.windSpeed.toString().padEnd(2)}kts @ ${r.windDirection.toString().padEnd(
        3
      )}deg | Swell: ${r.swellHeight.toFixed(1)}m @ ${r.swellPeriod}s`
    );
  });

  await prisma.$disconnect();
}

main().catch(console.error);
