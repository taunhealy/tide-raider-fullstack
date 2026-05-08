import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    select: { id: true, name: true }
  });
  console.log(JSON.stringify(beaches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
