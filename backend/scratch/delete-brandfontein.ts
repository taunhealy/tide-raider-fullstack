import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: { name: { contains: "Brandfontein", mode: "insensitive" } },
    select: { id: true, name: true, regionId: true },
  });

  console.log("Found:", JSON.stringify(beaches, null, 2));

  if (beaches.length === 0) {
    console.log("No Brandfontein beaches found.");
    return;
  }

  const ids = beaches.map((b) => b.id);

  // Delete dependent scores first
  const deletedScores = await prisma.beachDailyScore.deleteMany({
    where: { beachId: { in: ids } },
  });
  console.log(`Deleted ${deletedScores.count} beach scores`);

  // Delete the beach
  const deleted = await prisma.beach.deleteMany({
    where: { id: { in: ids } },
  });
  console.log(`Deleted ${deleted.count} beach(es)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
