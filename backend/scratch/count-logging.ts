import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const beaches = await prisma.beach.findMany({
    where: {
      regionId: 'western-cape',
      isLongboarding: true
    },
    select: {
      name: true,
      isHiddenGem: true
    }
  });
  console.log('Longboarding beaches:', beaches);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
