
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for anything related to Buffel...");
  const beaches = await prisma.beach.findMany({
    where: {
      OR: [
        { name: { contains: 'Buffel', mode: 'insensitive' } },
        { location: { contains: 'Buffel', mode: 'insensitive' } },
        { description: { contains: 'Buffel', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      location: true,
      regionId: true
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
