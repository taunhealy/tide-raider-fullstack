const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    select: { id: true, name: true, coordinates: true }
  });
  console.log(`Found ${beaches.length} beaches.`);
  beaches.slice(0, 10).forEach(b => {
    console.log(`${b.name}: ${JSON.stringify(b.coordinates)}`);
  });
}

main().finally(() => prisma.$disconnect());
