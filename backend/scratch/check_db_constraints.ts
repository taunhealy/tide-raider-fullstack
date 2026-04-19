import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const results = await prisma.$queryRaw`
      SELECT 
          t.relname AS table_name,
          conname AS constraint_name, 
          pg_get_constraintdef(c.oid) AS constraint_definition
      FROM 
          pg_constraint c
      JOIN 
          pg_class t ON c.conrelid = t.oid
      WHERE 
          t.relname IN ('Forecast', 'BeachDailyScore');
    `;
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
