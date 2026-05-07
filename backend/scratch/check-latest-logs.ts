import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.logEntry.findMany({
    orderBy: { id: 'desc' }, // Assuming id might be sequential or just use createdAt if it exists
    take: 10
  });

  console.log('Absolute latest logs:');
  console.log(JSON.stringify(logs, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
