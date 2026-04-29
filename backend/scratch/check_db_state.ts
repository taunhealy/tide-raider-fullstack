
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- 🔍 DATABASE DIAGNOSTIC START ---");

  // 1. Check existing sport categories in BeachConditionProfile
  const distinctProfiles = await prisma.beachConditionProfile.findMany({
    select: { category: true },
    distinct: ['category']
  });
  console.log("Existing categories in BeachConditionProfile:", distinctProfiles.map(p => p.category));

  // 2. Check if category column exists in IntelligenceReport by trying to query it
  try {
    const reportSample = await prisma.intelligenceReport.findFirst({
      select: { id: true, category: true }
    } as any);
    console.log("IntelligenceReport 'category' column exists:", !!reportSample);
  } catch (e) {
    console.log("IntelligenceReport 'category' column DOES NOT EXIST yet.");
  }

  // 3. Check existing sport categories in BeachDailyScore
  const distinctScores = await prisma.beachDailyScore.findMany({
    select: { category: true },
    distinct: ['category']
  });
  console.log("Existing categories in BeachDailyScore:", distinctScores.map(s => s.category));

  console.log("--- 🔍 DATABASE DIAGNOSTIC END ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
