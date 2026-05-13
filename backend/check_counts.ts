import { prisma } from './src/lib/prisma';

async function test() {
  const count = await prisma.alertNotification.count();
  console.log(`Total AlertNotification records: ${count}`);
  
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  
  const todayCount = await prisma.alertNotification.count({
    where: {
      createdAt: { gte: todayStart }
    }
  });
  console.log(`AlertNotification records created today: ${todayCount}`);

  const recent = await prisma.alertNotification.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, alertName: true, details: true }
  });

  for (const r of recent) {
      console.log(`ID: ${r.id}, CreatedAt: ${r.createdAt}, Name: ${r.alertName}`);
  }
}

test();
