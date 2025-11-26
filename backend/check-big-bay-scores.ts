/**
 * Check Big Bay scores in the database
 * Run: npx tsx check-big-bay-scores.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkBigBayScores() {
  try {
    console.log("🔍 Checking Big Bay scores...\n");

    // Find Big Bay beach
    const bigBay = await prisma.beach.findFirst({
      where: {
        name: {
          contains: "Big Bay",
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        regionId: true,
      },
    });

    if (!bigBay) {
      console.log("❌ Big Bay beach not found");
      return;
    }

    console.log(`✅ Found Big Bay: ${bigBay.name} (${bigBay.id})`);
    console.log(`   Region: ${bigBay.regionId}\n`);

    // Get today's date at UTC midnight
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    console.log(`📅 Today (UTC midnight): ${today.toISOString()}\n`);

    // Get all scores for Big Bay
    const allScores = await prisma.beachDailyScore.findMany({
      where: {
        beachId: bigBay.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    console.log(`📊 All recent scores for Big Bay (last 10):`);
    allScores.forEach((score, i) => {
      const isToday = score.date.toISOString().split("T")[0] === today.toISOString().split("T")[0];
      console.log(`  ${i + 1}. Date: ${score.date.toISOString().split("T")[0]} ${isToday ? "← TODAY" : ""}`);
      console.log(`     Source: ${score.source}`);
      console.log(`     Score: ${score.score}`);
      console.log(`     Star Rating: ${score.starRating}`);
      console.log(`     Created: ${score.createdAt.toISOString()}`);
      console.log("");
    });

    // Get today's scores specifically
    const todayScores = await prisma.beachDailyScore.findMany({
      where: {
        beachId: bigBay.id,
        date: today,
      },
    });

    console.log(`\n🎯 Today's scores for Big Bay:`);
    if (todayScores.length === 0) {
      console.log("  ❌ NO SCORES FOR TODAY!");
      console.log("  This means the cron job hasn't run yet or failed.");
    } else {
      todayScores.forEach((score) => {
        console.log(`  Source: ${score.source}`);
        console.log(`  Score: ${score.score}`);
        console.log(`  Star Rating: ${score.starRating}`);
        console.log(`  Created: ${score.createdAt.toISOString()}`);
        console.log("");
      });
    }

    // Check what the historical endpoint would return
    console.log("\n🔍 Simulating historical endpoint query for 'today' period:");
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const historicalScores = await prisma.beachDailyScore.findMany({
      where: {
        beachId: bigBay.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        source: "WINDFINDER",
      },
      orderBy: {
        date: "desc",
      },
    });

    console.log(`  Found ${historicalScores.length} scores between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    historicalScores.forEach((score) => {
      console.log(`    Date: ${score.date.toISOString()}`);
      console.log(`    Score: ${score.score}`);
      console.log(`    Created: ${score.createdAt.toISOString()}`);
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBigBayScores();
