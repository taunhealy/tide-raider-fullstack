import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.forecast.count();
  console.log('Total forecasts:', count);
  const sample = await prisma.forecast.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Latest forecast:', sample);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
