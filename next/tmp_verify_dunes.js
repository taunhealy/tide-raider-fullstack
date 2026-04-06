const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.beach.findMany({ 
    where: { name: { contains: 'Dunes', mode: 'insensitive' } } 
  });
  console.log(`Found ${result.length} beaches for "Dunes":`, JSON.stringify(result, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
