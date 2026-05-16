
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Recent Alert Notifications ---');
  const notifications = await prisma.alertNotification.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      alert: {
        select: {
          name: true,
          userId: true,
          logEntryId: true,
          user: { select: { email: true } }
        }
      }
    }
  });

  if (notifications.length > 0) {
    console.log('--- Body of first notification ---');
    console.log(notifications[0].details);
    console.log('---');
  }

  notifications.forEach(n => {
    const dateMatch = n.details?.match(/<div class="data-label">Date:<\/div><div class="data-value">(.*?)<\/div>/);
    const dateInDetails = dateMatch ? dateMatch[1] : 'Unknown';

    console.log(`ID: ${n.id}`);
    console.log(`Created At: ${n.createdAt.toISOString()}`);
    console.log(`Alert: ${n.alertName} (User: ${n.alert?.user?.email})`);
    console.log(`Target Date (in details): ${dateInDetails}`);
    console.log(`Log Entry ID: ${n.alert?.logEntryId}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
