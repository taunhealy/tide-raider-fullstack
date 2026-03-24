import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const c: any[] = await prisma.$queryRaw`SELECT * FROM "Country" LIMIT 1`;
  console.dir(c);
}

main().finally(() => prisma.$disconnect());
