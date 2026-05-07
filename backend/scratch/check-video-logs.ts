import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.logEntry.findMany({
    where: { 
      OR: [
        { videoUrl: { not: null } },
        { videoUrls: { not: null } }
      ]
    },
    orderBy: { date: 'desc' },
    take: 10,
    include: { beach: true }
  });

  console.log('Latest logs with videos:');
  console.log(JSON.stringify(logs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
