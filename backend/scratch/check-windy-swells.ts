import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const windyForecasts = await prisma.forecast.findMany({
    where: {
      source: "WINDY"
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  console.log("WINDY_FORECASTS_SAMPLE:");
  windyForecasts.forEach(f => {
    console.log(`Date: ${f.date.toISOString().split('T')[0]}, Slot: ${f.timeSlot}`);
    console.log(`  Swell 1: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°`);
    console.log(`  Swell 2: ${f.swellHeight2 || 0}m @ ${f.swellPeriod2 || 0}s ${f.swellDirection2 || 0}°`);
    console.log(`  Swell 3: ${f.swellHeight3 || 0}m @ ${f.swellPeriod3 || 0}s ${f.swellDirection3 || 0}°`);
    console.log('---');
  });

  const withSecondarySwell = windyForecasts.filter(f => (f.swellHeight2 || 0) > 0);
  console.log(`Total checked: ${windyForecasts.length}`);
  console.log(`With secondary swell: ${withSecondarySwell.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
