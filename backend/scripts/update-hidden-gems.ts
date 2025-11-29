/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import { beachData } from "../src/data/beachData";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Scanning beachData.ts for hidden gems...");
  
  const hiddenGemsInData = beachData.filter(b => b.isHiddenGem === true);
  console.log(`Found ${hiddenGemsInData.length} hidden gems in source data.\n`);
  
  hiddenGemsInData.forEach(b => {
    console.log(`- ${b.name} (${b.id})`);
  });

  console.log("\n🔧 Updating database...");

  let updatedCount = 0;
  let errorCount = 0;

  for (const beach of hiddenGemsInData) {
    try {
      // Check if beach exists first
      const existing = await prisma.beach.findUnique({
        where: { id: beach.id }
      });

      if (!existing) {
        console.warn(`⚠️ Beach ${beach.name} (${beach.id}) not found in database! Skipping.`);
        continue;
      }

      await prisma.beach.update({
        where: { id: beach.id },
        data: { isHiddenGem: true },
      });

      console.log(`✓ Updated ${beach.name}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${beach.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Update complete!`);
  console.log(`  - Updated: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);

  // Verify
  const dbCount = await prisma.beach.count({
    where: { isHiddenGem: true },
  });
  console.log(`\n📊 Total beaches with isHiddenGem=true in DB: ${dbCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
