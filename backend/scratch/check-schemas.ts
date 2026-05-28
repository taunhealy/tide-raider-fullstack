import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata
    `;
    console.log('Schemas in database:', schemas);
  } catch (err) {
    console.error('Error querying schemas:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
