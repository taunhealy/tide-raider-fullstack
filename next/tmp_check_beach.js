const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const beach = await prisma.beach.findFirst({
      where: { id: 'plettenberg-bay' }
    });
    if (!beach) {
       console.log('NOT FOUND');
       return;
    }
    console.log('ID:', beach.id);
    console.log('NAME:', beach.name);
    console.log('IDEAL_WIND:', beach.optimalWindDirections);
    console.log('IDEAL_SWELL_DIR:', beach.optimalSwellDirections);
    console.log('MIN_SWELL:', beach.minSwellHeight);
    console.log('MAX_SWELL:', beach.maxSwellHeight);
    console.log('MIN_PERIOD:', beach.minSwellPeriod);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
