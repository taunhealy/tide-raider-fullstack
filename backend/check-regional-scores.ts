import { prisma } from "./src/lib/prisma";

async function checkRegionalScores() {
  console.log("Checking regional scores...\n");

  // Check Western Cape region
  const region = await prisma.region.findFirst({
    where: {
      OR: [
        { id: "western-cape" },
        { name: { contains: "western", mode: "insensitive" } },
      ],
    },
  });

  if (!region) {
    console.log("❌ Western Cape region not found");
    return;
  }

  console.log(`✅ Found region: ${region.name} (${region.id})\n`);

  // Check beaches in Western Cape
  const beaches = await prisma.beach.findMany({
    where: { regionId: region.id },
    select: { id: true, name: true },
  });

  console.log(`Found ${beaches.length} beaches in ${region.name}\n`);

  // Check for daily scores
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beach: {
        regionId: region.id,
      },
      date: {
        gte: today,
      },
    },
    include: {
      beach: {
        select: { name: true },
      },
    },
    orderBy: {
      score: "desc",
    },
    take: 10,
  });

  console.log(`Found ${scores.length} scores for today in ${region.name}\n`);

  if (scores.length > 0) {
    console.log("Top scores:");
    scores.forEach((score, i) => {
      console.log(
        `${i + 1}. ${score.beach.name}: ${score.score} points (${score.date.toISOString().split("T")[0]})`
      );
    });
  } else {
    console.log("❌ No scores found for today");
    console.log("\nChecking if there are ANY scores in the database...");

    const anyScores = await prisma.beachDailyScore.findMany({
      where: {
        beach: {
          regionId: region.id,
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
      include: {
        beach: {
          select: { name: true },
        },
      },
    });

    if (anyScores.length > 0) {
      console.log(`\nFound ${anyScores.length} historical scores:`);
      anyScores.forEach((score) => {
        console.log(
          `- ${score.beach.name}: ${score.score} points (${score.date.toISOString().split("T")[0]})`
        );
      });
    } else {
      console.log("❌ No scores found at all for this region");
      console.log(
        "\nThis means the scoring system hasn't run yet or there's no forecast data."
      );
    }
  }

  await prisma.$disconnect();
}

checkRegionalScores().catch(console.error);
