import { prisma } from "../../../src/lib/prisma";

async function verifyInventory() {
  const dates = await prisma.beachDailyScore.groupBy({
    by: ['date'],
    orderBy: { date: 'asc' },
    where: {
      date: { gte: new Date() }
    }
  });

  console.log("\n📡 --- DATABASE FORECAST INVENTORY ---");
  dates.forEach(d => {
    console.log(`Date: ${d.date.toISOString().split("T")[0]}`);
  });
}

verifyInventory()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
