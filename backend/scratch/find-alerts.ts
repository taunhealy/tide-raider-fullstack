import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Searching for active alerts...");
  
  const alerts = await prisma.alert.findMany({
    where: {
      active: true,
      name: {
        contains: "Long Beach",
        mode: "insensitive"
      }
    },
    include: {
      user: true
    }
  });

  if (alerts.length === 0) {
    console.log("❌ No active 'Long Beach' alerts found.");
    // Search all alerts to see what we have
    const allAlerts = await prisma.alert.findMany({
      take: 5,
      include: { user: true }
    });
    console.log("Recent alerts:", allAlerts.map(a => ({ name: a.name, user: a.user.email, active: a.active })));
  } else {
    console.log(`✅ Found ${alerts.length} matching alerts:`);
    alerts.forEach(alert => {
      console.log(`- Alert: ${alert.name}`);
      console.log(`  User: ${alert.user.email}`);
      console.log(`  Target Star Rating: ${alert.starRating}`);
      console.log(`  Beach ID: ${alert.beachId}`);
      console.log(`  Notification: ${alert.notificationMethod}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
