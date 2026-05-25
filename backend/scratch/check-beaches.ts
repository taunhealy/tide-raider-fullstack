import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Checking all beaches in the database...");
  const beaches = await prisma.beach.findMany({
    select: {
      id: true,
      name: true,
      regionId: true
    }
  });

  console.log(`Found ${beaches.length} beaches:`);
  beaches.slice(0, 15).forEach((b) => {
    console.log(`Beach ID: ${b.id}, Name: ${b.name}, Region ID: ${b.regionId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
