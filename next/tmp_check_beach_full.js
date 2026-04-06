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
    console.log('DATA:', JSON.stringify(beach, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
