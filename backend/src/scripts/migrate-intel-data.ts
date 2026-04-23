import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting IntelligenceReport data migration...');

  const reports = await prisma.intelligenceReport.findMany({
    where: {
      OR: [
        { isWeekly: { not: null } },
        { weekEndDate: { not: null } }
      ]
    }
  });

  console.log(`📊 Found ${reports.length} reports to migrate.`);

  for (const report of reports) {
    const duration = report.isWeekly ? 7 : 1;
    const endDate = report.weekEndDate || null;

    await prisma.intelligenceReport.update({
      where: { id: report.id },
      data: {
        duration: duration,
        endDate: endDate,
        // Optional: clear legacy fields to mark as processed
        // isWeekly: null,
        // weekEndDate: null
      }
    });
  }

  console.log('✅ Data migration complete.');
}

migrateData()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
