import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  console.log(`Checking for forecast on: ${today.toISOString()}`);

  const forecast = await prisma.forecast.findMany({
    where: {
      date: today
    },
    include: {
      region: true
    }
  });

  console.log(`Found ${forecast.length} forecast(s) for today.`);
  
  if (forecast.length > 0) {
    console.log("First forecast detail:", JSON.stringify(forecast[0], null, 2));
  }
  
  forecast.forEach(f => {
    console.log(`- Region: ${f.region.name} (${f.regionId}), Source: ${f.source}, Wind: ${f.windSpeed}kt`);
  });

  // Also check scores
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      date: today
    },
    take: 5
  });
  console.log(`Found ${scores.length} score(s) for today (showing up to 5).`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
