
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: {
      name: {
        in: ['Silversands Beach', 'Sunset Beach', 'Muizenberg Beach', 'Pringle Bay']
      }
    },
    select: {
      name: true,
      regionId: true
    }
  });
  console.log(JSON.stringify(beaches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
