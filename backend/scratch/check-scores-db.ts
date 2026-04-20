import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScores() {
  const regionId = 'western-cape';
  console.log(`Checking BeachDailyScore for ${regionId}...`);
  
  const scores = await prisma.beachDailyScore.findMany({
    where: { regionId },
    select: { date: true }
  });
  
  const dates = scores.reduce((acc: any, s: any) => {
    const d = s.date.toISOString().split('T')[0];
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Scores by Date:', JSON.stringify(dates, null, 2));
  
  await prisma.$disconnect();
}

checkScores().catch(console.error);
