import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  console.log("🔍 Checking for notifications sent today...");
  
  const notifications = await prisma.alertNotification.findMany({
    where: {
      createdAt: { gte: todayStart },
      alertName: { contains: "Long Beach" }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (notifications.length === 0) {
    console.log("❌ No notifications found for 'Long Beach' today.");
  } else {
    console.log(`✅ Found ${notifications.length} notifications:`);
    notifications.forEach(n => {
      console.log(`- Alert: ${n.alertName}`);
      console.log(`  Success: ${n.success}`);
      console.log(`  CreatedAt: ${n.createdAt.toISOString()}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
