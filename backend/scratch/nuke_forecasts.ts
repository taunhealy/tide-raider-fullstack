import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const deleted = await prisma.forecast.deleteMany({});
  console.log(`Deleted ${deleted.count} forecasts.`);
  await prisma.$disconnect();
}

main().catch(console.error);
