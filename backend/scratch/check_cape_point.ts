
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for beaches at Cape Point...");
  const beaches = await prisma.beach.findMany({
    where: {
      location: { contains: 'Cape Point', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      location: true
    }
  });

  console.log("Results:", JSON.stringify(beaches, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
