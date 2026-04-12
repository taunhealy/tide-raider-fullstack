import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up obsolete entries...");
  
  const toDelete = ["baby-lamb"];
  
  for (const id of toDelete) {
    try {
      const beach = await prisma.beach.findUnique({ where: { id } });
      if (beach) {
        await prisma.beach.delete({ where: { id } });
        console.log(`✓ Deleted beach: ${id}`);
      } else {
        console.log(`Beach not found: ${id}`);
      }
    } catch (error) {
      console.error(`Failed to delete beach ${id}:`, error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
