import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: 'Pringle Bay', mode: 'insensitive' } }
  });

  if (!beach) {
    console.log('Beach not found');
    return;
  }

  const logs = await prisma.logEntry.findMany({
    where: { beachId: beach.id },
    orderBy: { date: 'desc' },
    take: 1
  });

  console.log('Latest log for Pringle Bay:');
  console.log(JSON.stringify(logs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
