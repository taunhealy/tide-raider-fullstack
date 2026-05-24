import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Dropping unique constraint from IntelligenceReport...");
  try {
    // Drop the constraint that blocks dropping the index
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "IntelligenceReport" 
      DROP CONSTRAINT IF EXISTS "IntelligenceReport_beachId_userId_date_persona_duration_cat_key"
    `);
    console.log("✅ Unique constraint dropped successfully!");
  } catch (e) {
    console.error("❌ Failed to drop constraint:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
