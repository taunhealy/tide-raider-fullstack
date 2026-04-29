
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: { id: { in: ["melkbos", "the-hoek", "dunes", "horse-trails", "pebbles"] } },
    select: { id: true, name: true, coordinates: true, isHiddenGem: true }
  });
  console.log("Beaches Data from DB:", JSON.stringify(beaches, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
