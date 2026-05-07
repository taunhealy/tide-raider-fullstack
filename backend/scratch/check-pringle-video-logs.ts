import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.logEntry.findMany({
    where: { 
      beachId: 'seafarm-pringle-bay',
      OR: [
        { videoUrl: { not: null } },
        { videoUrls: { not: null } }
      ]
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  console.log('Latest Pringle Bay logs with videos:');
  console.log(JSON.stringify(logs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
