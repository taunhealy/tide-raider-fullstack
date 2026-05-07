import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const beach = await prisma.beach.findUnique({
    where: { id: 'elands-bay-the-point' }
  });
  console.log('Elands Bay from DB:', JSON.stringify(beach, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
