const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGlencairn() {
  try {
    const beach = await prisma.beach.findFirst({
      where: { name: 'Glencairn' }
    });
    console.log('Wind Directions:', beach.optimalWindDirections);
    console.log('Swell Directions:', beach.optimalSwellDirections);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGlencairn();
