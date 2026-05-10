const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('--- Verifying Forecast Sources ---');
  
  const sources = await prisma.forecast.groupBy({
    by: ['source'],
    _count: {
      source: true
    }
  });
  
  console.log('Record counts by source:');
  console.table(sources);
  
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const recentRecords = await prisma.forecast.findMany({
    where: {
      createdAt: { gte: tenMinutesAgo }
    },
    select: {
      id: true,
      source: true,
      date: true,
      timeSlot: true,
      createdAt: true
    }
  });
  
  console.log(`Found ${recentRecords.length} records created in the last 10 minutes.`);
  if (recentRecords.length > 0) {
    console.table(recentRecords.slice(0, 10));
  }

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
