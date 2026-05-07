import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const beaches = await prisma.beach.findMany({
    where: { name: { contains: 'Pringle', mode: 'insensitive' } }
  });
  console.log('Beaches containing Pringle:');
  console.log(JSON.stringify(beaches, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
