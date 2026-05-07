import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const beaches = await prisma.beach.findMany({
    where: {
      regionId: 'western-cape',
      isHiddenGem: true,
      OR: [
        { isLongboarding: true },
        { isFoiling: true }
      ]
    },
    select: {
      name: true,
      isLongboarding: true,
      isFoiling: true
    }
  });
  console.log('Hidden Gem Longboarding/Foiling beaches in Western Cape:', beaches);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
