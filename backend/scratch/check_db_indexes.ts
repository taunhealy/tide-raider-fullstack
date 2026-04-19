import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const results = await prisma.$queryRaw`
      SELECT 
          indexname,
          indexdef
      FROM 
          pg_indexes
      WHERE 
          tablename = 'Forecast';
    `;
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
