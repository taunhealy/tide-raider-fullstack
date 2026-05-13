import { prisma } from './src/lib/prisma';

async function test() {
  const scores = await prisma.beachDailyScore.findMany({ 
      where: { beachId: 'long-beach', date: new Date('2026-05-07T00:00:00Z') } 
  });
  console.log(JSON.stringify(scores, null, 2));
}

test();
