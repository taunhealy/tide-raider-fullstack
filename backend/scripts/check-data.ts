import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  console.log("🔍 Checking database for surf scores...\n");

  // Check total beaches
  const beachCount = await prisma.beach.count();
  console.log(`📍 Total beaches: ${beachCount}`);

  // Check total scores
  const scoreCount = await prisma.beachDailyScore.count();
  console.log(`📊 Total scores: ${scoreCount}`);

  // Check forecasts
  const forecastCount = await prisma.forecast.count();
  console.log(`🌊 Total forecasts: ${forecastCount}`);

  // Check recent scores
  const recentScores = await prisma.beachDailyScore.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      beach: {
        select: { name: true, regionId: true },
      },
    },
  });

  console.log("\n📈 Most recent scores:");
  recentScores.forEach((score) => {
    console.log(
      `  - ${score.beach.name} (${score.beach.regionId}): ${score.score} points on ${score.date.toISOString().split("T")[0]}`
    );
  });

  // Check Western Cape specifically
  const westernCapeScores = await prisma.beachDailyScore.count({
    where: {
      beach: {
        regionId: "western-cape",
      },
    },
  });
  console.log(`\n🏖️  Western Cape scores: ${westernCapeScores}`);

  // Check today's scores
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayScores = await prisma.beachDailyScore.count({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
  console.log(`📅 Scores for today (${today.toISOString().split("T")[0]}): ${todayScores}`);

  await prisma.$disconnect();
}

checkData().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
