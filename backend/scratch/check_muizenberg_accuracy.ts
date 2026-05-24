import { prisma } from "../src/lib/prisma";

async function main() {
  const accuracy = await prisma.beachSourceAccuracy.findMany({
    where: { beachId: "muizenberg-beach" },
    orderBy: { voteCount: "desc" }
  });

  console.log("\n--- SOURCE ACCURACY VOTES FOR MUIZENBERG ---");
  if (accuracy.length === 0) {
    console.log("No source accuracy votes found yet.");
  } else {
    for (const a of accuracy) {
      console.log(`Source: ${a.source} | Votes: ${a.voteCount}`);
    }
  }

  // Also count historical log entries' most accurate source selections
  const logs = await prisma.logEntry.groupBy({
    by: ['mostAccurateSource'],
    where: {
      beachId: "muizenberg-beach",
      mostAccurateSource: { not: null }
    },
    _count: {
      id: true
    }
  });

  console.log("\n--- HISTORICAL LOG ENTRY VOTES (MOST ACCURATE) ---");
  for (const l of logs) {
    console.log(`Source: ${l.mostAccurateSource} | Log Counts: ${l._count.id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
