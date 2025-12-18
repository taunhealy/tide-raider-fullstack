
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugLongBeachAlert() {
  try {
    const alerts = await prisma.alert.findMany({
      where: { name: { contains: 'Long Beach 1 star' } },
    });
    const alert = alerts[0];
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const notifications = await prisma.alertNotification.findMany({
      where: {
        alertId: alert.id,
        createdAt: { gte: todayStart },
      },
    });

    notifications.forEach(n => {
      console.log(`Success: ${n.success}`);
      console.log(`Error Preview: ${n.details?.substring(0, 500)}`);
    });

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLongBeachAlert();
