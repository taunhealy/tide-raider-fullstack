
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alertId = '28f28381-45d1-48c2-8349-366d96c3a756';
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: { beach: true }
  });

  console.log(`Alert ID: ${alert?.id}`);
  console.log(`Beach ID (direct): ${alert?.beachId}`);
  console.log(`Beach ID (relation): ${alert?.beach?.id}`);
  console.log(`Log Entry ID: ${alert?.logEntryId}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
