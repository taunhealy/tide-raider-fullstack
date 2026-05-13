import { prisma } from './src/lib/prisma';

async function test() {
  console.log('Checking AlertNotification records...');
  
  try {
    const notifications = await prisma.alertNotification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        alert: true
      }
    });

    for (const notif of notifications) {
      console.log(`Notification ID: ${notif.id}`);
      console.log(`  Alert Name: ${notif.alertName}`);
      console.log(`  Beach: ${notif.beachName}`);
      console.log(`  Created At: ${notif.createdAt}`);
      console.log(`  Details Snapshot: ${notif.details?.substring(0, 500)}`);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
