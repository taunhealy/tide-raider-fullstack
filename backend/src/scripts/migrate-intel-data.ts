import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This migration script is a no-op.
 * The isWeekly and weekEndDate fields were removed from IntelligenceReport
 * in a previous schema migration. The data has already been migrated.
 */
async function migrateData() {
  console.log('✅ IntelligenceReport migration already applied. Nothing to do.');
}

migrateData()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
