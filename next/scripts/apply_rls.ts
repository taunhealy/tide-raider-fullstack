
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(process.cwd(), 'prisma', 'fix_rls.sql');
  console.log(`Reading SQL from ${sqlPath}`);
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  // Split by newline to execute one by one (executeRaw deals with one statement usually, or we can just run the whole block if supported, but safer line by line for error tracking)
  const lines = sqlContent.split('\n').filter(line => line.trim().length > 0 && !line.startsWith('--'));

  console.log(`Found ${lines.length} statements to execute.`);

  for (const line of lines) {
    try {
      if (!line.trim()) continue;
      console.log(`Executing: ${line}`);
      await prisma.$executeRawUnsafe(line);
      console.log('Success.');
    } catch (error: any) {
        // Ignore "already enabled" errors or similar minor issues
        if (error.message.includes('already enabled')) {
            console.log('Skipping (RLS already enabled).');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
             console.log(`Skipping (Table does not exist): ${line}`);
        } else {
            console.error(`Error executing: ${line}`);
            console.error(error.message);
        }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
