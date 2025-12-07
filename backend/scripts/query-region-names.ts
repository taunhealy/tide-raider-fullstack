/**
 * Query the database to check region names and IDs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function queryRegionNames() {
  try {
    console.log("🔍 Querying Region table for naming issues...\n");

    // Query all regions
    const regions = await prisma.region.findMany({
      select: {
        id: true,
        name: true,
        countryId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`Found ${regions.length} regions:\n`);
    console.log("ID\t\t\t\tName");
    console.log("-".repeat(60));

    for (const region of regions) {
      const idDisplay = region.id.padEnd(25);
      const nameDisplay = region.name;
      console.log(`${idDisplay}\t${nameDisplay}`);
    }

    // Check specific regions mentioned by user
    console.log("\n\n🔍 Checking specific regions:\n");
    const specificRegions = ["western-cape", "kwazulu-natal", "kwa-zulu-natal"];

    for (const regionId of specificRegions) {
      const region = await prisma.region.findUnique({
        where: { id: regionId },
        select: {
          id: true,
          name: true,
          countryId: true,
        },
      });

      if (region) {
        console.log(`✅ Found: ${region.id}`);
        console.log(`   Name: "${region.name}"`);
        console.log(`   Country: ${region.countryId}`);
      } else {
        console.log(`❌ Not found: ${regionId}`);
      }
      console.log();
    }

    // Check beaches in these regions
    console.log("\n\n🔍 Checking beaches in Western Cape and KwaZulu-Natal:\n");
    const testRegions = ["western-cape", "kwazulu-natal", "kwa-zulu-natal"];

    for (const regionId of testRegions) {
      const beaches = await prisma.beach.findMany({
        where: { regionId },
        select: {
          id: true,
          name: true,
          regionId: true,
        },
        take: 3,
      });

      if (beaches.length > 0) {
        console.log(`\nRegion ID: ${regionId}`);
        console.log(`Beaches found: ${beaches.length} (showing first 3)`);
        beaches.forEach((beach) => {
          console.log(`  - ${beach.name} (id: ${beach.id})`);
        });
      }
    }

    // Check if region relation is being included properly
    console.log("\n\n🔍 Testing region relation in beach query:\n");
    const testBeach = await prisma.beach.findFirst({
      where: { regionId: "western-cape" },
      include: {
        region: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (testBeach) {
      console.log(`Beach: ${testBeach.name}`);
      console.log(`Region ID: ${testBeach.regionId}`);
      console.log(`Region relation:`);
      console.log(`  - ID: ${testBeach.region?.id}`);
      console.log(`  - Name: "${testBeach.region?.name}"`);
    }
  } catch (error) {
    console.error("Error querying regions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

queryRegionNames();
