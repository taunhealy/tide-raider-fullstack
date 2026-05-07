import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: "Elands Bay", mode: "insensitive" } },
    include: { conditionProfiles: true }
  });

  if (!beach) {
    console.log("Beach not found");
    return;
  }

  console.log("BEACH:", beach.name);
  console.log("PROFILES:", JSON.stringify(beach.conditionProfiles, null, 2));

  const tomorrowStart = new Date("2026-05-08T00:00:00Z");
  const tomorrowEnd = new Date("2026-05-09T00:00:00Z");

  const scores = await prisma.beachDailyScore.findMany({
    where: { 
      beachId: beach.id,
      date: { gte: tomorrowStart, lt: tomorrowEnd }
    },
    orderBy: { timeSlot: "asc" }
  });

  scores.forEach((s: any) => {
    const cond = s.conditions as any;
    console.log(`[${s.source}] [${s.timeSlot}] Score: ${s.score}, Stars: ${s.starRating}`);
    console.log(`Conditions: Swell ${cond.swellHeight}m @ ${cond.swellPeriod}s ${cond.swellDirection}°, Wind ${cond.windSpeed}kts ${cond.windDirection}°`);
    console.log(`Deductions: ${(cond.deductions || []).join(", ")}`);
    console.log("---");
  });

  const forecast = await prisma.forecast.findFirst({
    where: { regionId: beach.regionId },
    orderBy: { date: "desc" }
  });

  console.log("MOST RECENT FORECAST DATA:", JSON.stringify(forecast, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
