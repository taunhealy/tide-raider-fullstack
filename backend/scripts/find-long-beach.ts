
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: {
      name: { contains: "Long Beach", mode: "insensitive" }
    }
  });

  console.log("Found beaches:");
  console.log(JSON.stringify(beaches.map(b => ({ id: b.id, name: b.name, regionId: b.regionId })), null, 2));

  await prisma.$disconnect();
}

main();
