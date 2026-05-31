import { prisma } from '../src/lib/prisma';

async function check() {
  const beach = await prisma.beach.findUnique({
    where: { id: "outer-kom" }
  });
  console.log(`Beach: ${beach?.name}, Region: ${beach?.regionId}`);
}

check().catch(console.error).finally(() => prisma.$disconnect());
