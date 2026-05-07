import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.logEntry.findMany({
    where: { 
      OR: [
        { beachName: { contains: 'Pringle', mode: 'insensitive' } },
        { beachId: { contains: 'pringle', mode: 'insensitive' } }
      ]
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  console.log('Logs for Pringle:');
  console.log(JSON.stringify(logs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
