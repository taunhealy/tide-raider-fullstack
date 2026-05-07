import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.logEntry.findMany({
    where: { 
      videoUrls: { not: null }
    },
    orderBy: { id: 'desc' },
    take: 50
  });

  const uploadLogs = logs.filter(log => {
    const urls = log.videoUrls as any[];
    return urls && urls.some(v => v.type === 'upload');
  });

  console.log('Logs with uploaded videos:');
  console.log(JSON.stringify(uploadLogs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
