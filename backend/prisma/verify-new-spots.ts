import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: {
      OR: [
        { name: { contains: "Lamb" } },
        { name: { contains: "Papendorp" } },
        { id: "little-lamb" },
        { id: "baby-lamb" }
      ]
    },
    select: { id: true, name: true, coordinates: true }
  });
  
  console.log("Found beaches:", JSON.stringify(beaches, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
