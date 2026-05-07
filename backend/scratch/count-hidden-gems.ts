import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const count = await prisma.beach.count({
    where: {
      regionId: 'western-cape',
      isHiddenGem: true
    }
  });
  console.log('Hidden Gems in Western Cape:', count);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
