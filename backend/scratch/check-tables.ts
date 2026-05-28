import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    `;
    console.log('Tables in database:', tables);
  } catch (err) {
    console.error('Error querying tables:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
