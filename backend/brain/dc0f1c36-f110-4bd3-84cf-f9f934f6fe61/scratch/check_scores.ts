import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const regionId = 'western-cape';

  console.log(`Checking BeachDailyScore for region: ${regionId}, date: ${today.toISOString()}`);

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      regionId: regionId,
      date: today
    },
    include: {
      beach: {
        select: { name: true }
      }
    }
  });

  console.log(`Found ${scores.length} score(s) for Western Cape today.`);
  
  scores.forEach(s => {
    console.log(`- Beach: ${s.beach.name}, Score: ${s.score}, Source: ${s.source}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
