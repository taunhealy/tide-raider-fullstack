const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding missing columns to LogEntry table...');
    
    // Add hiddenGemId to LogEntry if missing
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "LogEntry" ADD COLUMN IF NOT EXISTS "hiddenGemId" text;'
    );
    console.log('Added hiddenGemId column to LogEntry (if it was missing).');

  } catch (e) {
    console.error('Error adding columns:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
