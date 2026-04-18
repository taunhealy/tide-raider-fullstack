import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const regionId = 'western-cape';

  console.log(`Checking BeachDailyScore for region: ${regionId}, date: ${today.toISOString()}`);

  const sources = await prisma.beachDailyScore.groupBy({
    by: ['source'],
    where: {
      regionId: regionId,
      date: today
    },
    _count: {
       _all: true
    }
  });

  console.log('Scores found by source:');
  sources.forEach(s => {
    console.log(`- ${s.source}: ${s._count._all} scores`);
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
