import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: {
      name: { contains: "Muizenberg", mode: "insensitive" }
    },
    include: {
      region: true
    }
  });

  console.log("BEACHES:", JSON.stringify(beaches, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
