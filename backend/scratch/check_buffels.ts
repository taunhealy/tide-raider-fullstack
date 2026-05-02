
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for Buffels Bay...");
  const beaches = await prisma.beach.findMany({
    where: {
      name: {
        contains: 'Buffels',
        mode: 'insensitive'
      }
    }
  });

  console.log("Beaches found:", JSON.stringify(beaches, null, 2));

  const gems = await prisma.hiddenGem.findMany({
    where: {
      name: {
        contains: 'Buffels',
        mode: 'insensitive'
      }
    }
  });

  console.log("Hidden Gems found:", JSON.stringify(gems, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
