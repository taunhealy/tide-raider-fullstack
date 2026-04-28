
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const glencairn = await prisma.beach.findFirst({
    where: { name: 'Glencairn' }
  });

  console.log('Glencairn Beach:', glencairn);

  const logs = await prisma.logEntry.findMany({
    where: { beachName: 'Glencairn' },
    include: { forecast: true }
  });

  console.log('Logs for Glencairn:', JSON.stringify(logs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
