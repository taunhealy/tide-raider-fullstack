
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Inspecting Alerts ---');
  const alerts = await prisma.alert.findMany({
    where: {
      id: { in: ['c3abe0a9-862c-41ff-ba30-40ee4e5aa474', '072d273a-eb20-4814-b173-9ee82272ce4f'] } // These are notification IDs, wait
    }
  });
  
  // Get alert IDs from the notifications we saw
  const notificationIds = ['c3abe0a9-862c-41ff-ba30-40ee4e5aa474', '072d273a-eb20-4814-b173-9ee82272ce4f'];
  const notifications = await prisma.alertNotification.findMany({
    where: { id: { in: notificationIds } },
    select: { alertId: true }
  });
  
  const alertIds = notifications.map(n => n.alertId);
  
  const alertData = await prisma.alert.findMany({
    where: { id: { in: alertIds } },
    include: {
      logEntry: true
    }
  });

  alertData.forEach(a => {
    console.log(`Alert ID: ${a.id}`);
    console.log(`Name: ${a.name}`);
    console.log(`Active: ${a.active}`);
    console.log(`Type: ${a.alertType}`);
    console.log(`Star Rating: ${a.starRating}`);
    console.log(`Forecast Date (DB): ${a.forecastDate?.toISOString()}`);
    console.log(`Log Entry Date: ${a.logEntry?.date?.toISOString()}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
