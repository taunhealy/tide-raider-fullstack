import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to drop problematic constraint...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "BeachDailyScore" DROP CONSTRAINT IF EXISTS "BeachDailyScore_beachId_date_source_timeSlot_key";`);
    console.log('Constraint dropped successfully!');
  } catch (error) {
    console.error('Error dropping constraint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
