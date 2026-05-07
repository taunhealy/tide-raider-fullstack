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
    orderBy: { id: 'desc' },
    take: 20
  });

  console.log('Real logs with videos (Latest):');
  console.log(JSON.stringify(logs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
