import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const log = await prisma.raidLog.findUnique({
    where: { id: 'b5438909-67bf-41cb-b231-33400c369fff' },
    include: { beach: true }
  });
  console.log(JSON.stringify(log, null, 2));
}

main().finally(() => prisma.$disconnect());
