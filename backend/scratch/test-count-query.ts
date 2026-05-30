import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  const regionId = "western-cape";
  const dateStr = "2026-05-28";
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  console.log("🚀 Testing findMany with distinct...");
  const startTime = Date.now();
  try {
    const existingScores = await prisma.beachDailyScore.findMany({
      where: {
        regionId,
        date: targetDate,
      },
      select: {
        source: true,
        timeSlot: true,
      },
      distinct: ["source", "timeSlot"],
    });
    console.log("Existing combinations:", existingScores);
    console.log(`Query duration: ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error("Query failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
