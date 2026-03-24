import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const table = 'Alert';
  const columns: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '${table}'
  `);
  console.log(`Columns for ${table}:`);
  console.dir(columns);
}

main().finally(() => prisma.$disconnect());
