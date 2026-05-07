import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const beach = await prisma.beach.findUnique({
    where: { id: 'muizenberg-beach' }
  });
  console.log('Muizenberg isLongboarding:', beach?.isLongboarding);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
