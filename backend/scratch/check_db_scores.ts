import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking DB for beach daily score rows...");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: "thermopylae",
      source: { in: ["WINDFINDER", "WINDFINDER_SUPER"] },
      date: { gte: today }
    },
    orderBy: [
      { date: "asc" },
      { timeSlot: "asc" },
      { source: "asc" }
    ]
  });

  console.log(`Found ${scores.length} daily scores.`);
  const grouped: Record<string, Record<string, any>> = {};

  for (const s of scores) {
    const key = `${s.date.toISOString().split("T")[0]}_${s.timeSlot}`;
    if (!grouped[key]) grouped[key] = {};
    grouped[key][s.source] = {
      score: s.score,
      star: s.starRating,
      conditions: s.conditions,
      updated: s.updatedAt.toISOString()
    };
  }

  console.log("\nComparison Table for Beach Daily Scores:");
  const keys = Object.keys(grouped).sort().slice(0, 15);
  for (const key of keys) {
    const sources = grouped[key];
    console.log(`\nDate/Slot: ${key}`);
    console.log("  WINDFINDER:      ", sources["WINDFINDER"] ? { score: sources["WINDFINDER"].score, star: sources["WINDFINDER"].star } : "MISSING");
    console.log("  WINDFINDER_SUPER:", sources["WINDFINDER_SUPER"] ? { score: sources["WINDFINDER_SUPER"].score, star: sources["WINDFINDER_SUPER"].star } : "MISSING");
  }
}

main().catch(console.error);
