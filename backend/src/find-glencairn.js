const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: 'Glencairn', mode: 'insensitive' } }
  });
  console.log(JSON.stringify(beach, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
