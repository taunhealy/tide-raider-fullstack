/**
 * Fix region names in the database - convert snake_case to proper names
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map of region IDs to proper names
const regionNameMap: Record<string, string> = {
  "western-cape": "Western Cape",
  "eastern-cape": "Eastern Cape",
  "kwazulu-natal": "KwaZulu-Natal",
  "northern-cape": "Northern Cape",
};

async function fixRegionNames() {
  try {
    console.log("🔧 Fixing region names in database...\n");

    for (const [regionId, properName] of Object.entries(regionNameMap)) {
      const region = await prisma.region.findUnique({
        where: { id: regionId },
        select: { id: true, name: true },
      });

      if (region) {
        if (region.name !== properName) {
          console.log(`Updating ${regionId}: "${region.name}" -> "${properName}"`);
          await prisma.region.update({
            where: { id: regionId },
            data: { name: properName },
          });
          console.log(`✅ Updated ${regionId}\n`);
        } else {
          console.log(`✓ ${regionId} already has correct name: "${properName}"\n`);
        }
      } else {
        console.log(`⚠️  Region not found: ${regionId}\n`);
      }
    }

    // Verify the changes
    console.log("\n🔍 Verifying changes...\n");
    for (const [regionId, properName] of Object.entries(regionNameMap)) {
      const region = await prisma.region.findUnique({
        where: { id: regionId },
        select: { id: true, name: true },
      });

      if (region) {
        if (region.name === properName) {
          console.log(`✅ ${regionId}: "${region.name}"`);
        } else {
          console.log(`❌ ${regionId}: "${region.name}" (expected: "${properName}")`);
        }
      }
    }

    console.log("\n✅ Region name fix complete!");
  } catch (error) {
    console.error("Error fixing region names:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRegionNames();

