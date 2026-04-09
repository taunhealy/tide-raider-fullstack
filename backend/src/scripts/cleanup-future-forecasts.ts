import { prisma } from "../lib/prisma";

async function cleanup() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  // Calculate date 10 days from today
  const maxValidDate = new Date(today);
  maxValidDate.setDate(today.getDate() + 10);

  console.log(`Starting cleanup... Removing forecasts after ${maxValidDate.toISOString()}`);

  try {
    const deleted = await prisma.forecast.deleteMany({
      where: {
        date: {
          gt: maxValidDate
        }
      }
    });

    console.log(`✅ Successfully deleted ${deleted.count} stale/future forecast records.`);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
