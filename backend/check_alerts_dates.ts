import { prisma } from './src/lib/prisma';

async function test() {
  console.log('Checking recent AlertNotification records...');
  
  try {
    const notifications = await prisma.alertNotification.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    for (const notif of notifications) {
      console.log(`Notification ID: ${notif.id}`);
      console.log(`  Created At: ${notif.createdAt}`);
      
      const dateMatch = notif.details?.match(/<div class="data-label">Date:<\/div><div class="data-value">(.*?)<\/div>/);
      const beachMatch = notif.details?.match(/<div class="data-label">Beach:<\/div><div class="data-value">(.*?)<\/div>/);
      
      if (dateMatch) {
          console.log(`  Date in HTML: ${dateMatch[1]}`);
      }
      if (beachMatch) {
          console.log(`  Beach in HTML: ${beachMatch[1]}`);
      }
      console.log('---');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
