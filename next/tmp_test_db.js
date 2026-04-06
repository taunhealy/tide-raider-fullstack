const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dunes = await prisma.beach.findMany({
    where: { name: { contains: 'Dunes', mode: 'insensitive' } }
  });
  console.log('Results for "Dunes":', JSON.stringify(dunes, null, 2));
  const counts = await prisma.beach.count();
  console.log('Total beaches in table:', counts);
}
main().catch(console.error).finally(() => prisma.$disconnect());
