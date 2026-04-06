const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const beaches = await prisma.beach.findMany({
      where: {
        OR: [
          { name: { contains: 'Plett', mode: 'insensitive' } },
          { location: { contains: 'Plett', mode: 'insensitive' } }
        ]
      }
    });
    console.log('BEACHES:', beaches.map(b => ({ id: b.id, name: b.name, wind: b.optimalWindDirections, swell: b.optimalSwellDirections })));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
