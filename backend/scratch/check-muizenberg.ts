import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    const beach = await prisma.beach.findFirst({
      where: { name: 'Muizenberg' }
    });
    console.log('Muizenberg beach in DB:', beach);
    
    const count = await prisma.beach.count();
    console.log('Total beaches count in DB:', count);
  } catch (err) {
    console.error('Error querying Muizenberg:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
