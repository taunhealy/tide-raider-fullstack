/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Querying for Hidden Gems...\n");

  // Query beaches where isHiddenGem is true
  const hiddenGemBeaches = await prisma.beach.findMany({
    where: {
      isHiddenGem: true,
    },
    select: {
      id: true,
      name: true,
      regionId: true,
      countryId: true,
      location: true,
      difficulty: true,
      waveType: true,
      description: true,
      isHiddenGem: true,
      region: {
        select: {
          id: true,
          name: true,
        },
      },
      country: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(
    `Found ${hiddenGemBeaches.length} beaches with isHiddenGem = true\n`
  );

  if (hiddenGemBeaches.length > 0) {
    console.log("📍 Hidden Gem Beaches:\n");
    hiddenGemBeaches.forEach((beach, index) => {
      console.log(`${index + 1}. ${beach.name}`);
      console.log(`   ID: ${beach.id}`);
      console.log(`   Location: ${beach.location}`);
      console.log(`   Region: ${beach.region.name} (${beach.regionId})`);
      console.log(`   Country: ${beach.country.name} (${beach.countryId})`);
      console.log(`   Wave Type: ${beach.waveType}`);
      console.log(`   Difficulty: ${beach.difficulty}`);
      console.log(
        `   Description: ${beach.description.substring(0, 100)}...`
      );
      console.log("");
    });
  } else {
    console.log("❌ No beaches found with isHiddenGem = true");
  }

  // Also query the HiddenGem table
  console.log("\n🔍 Querying HiddenGem table...\n");

  const hiddenGems = await prisma.hiddenGem.findMany({
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
      regionId: true,
      countryId: true,
      waveType: true,
      difficulty: true,
      verified: true,
      createdAt: true,
      region: {
        select: {
          name: true,
        },
      },
      country: {
        select: {
          name: true,
        },
      },
      submittedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`Found ${hiddenGems.length} entries in HiddenGem table\n`);

  if (hiddenGems.length > 0) {
    console.log("💎 Hidden Gems:\n");
    hiddenGems.forEach((gem, index) => {
      console.log(`${index + 1}. ${gem.name}`);
      console.log(`   ID: ${gem.id}`);
      console.log(`   Location: ${gem.location}`);
      console.log(`   Region: ${gem.region.name} (${gem.regionId})`);
      console.log(`   Country: ${gem.country.name} (${gem.countryId})`);
      console.log(`   Status: ${gem.status}`);
      console.log(`   Verified: ${gem.verified}`);
      console.log(`   Wave Type: ${gem.waveType}`);
      console.log(`   Difficulty: ${gem.difficulty}`);
      console.log(
        `   Submitted By: ${gem.submittedBy.name} (${gem.submittedBy.email})`
      );
      console.log(`   Created: ${gem.createdAt.toISOString()}`);
      console.log("");
    });
  } else {
    console.log("❌ No entries found in HiddenGem table");
  }

  // Summary statistics
  console.log("\n📊 Summary:");
  console.log(`   Beaches with isHiddenGem=true: ${hiddenGemBeaches.length}`);
  console.log(`   HiddenGem table entries: ${hiddenGems.length}`);

  if (hiddenGems.length > 0) {
    const statusCounts = hiddenGems.reduce((acc, gem) => {
      acc[gem.status] = (acc[gem.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n   HiddenGem Status Breakdown:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });
  }

  // Write results to file
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("fs");
  const results = {
    hiddenGemBeaches,
    hiddenGems,
    summary: {
      beachesWithIsHiddenGem: hiddenGemBeaches.length,
      hiddenGemTableEntries: hiddenGems.length,
    },
  };
  fs.writeFileSync(
    "hidden-gems-result.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\n✅ Results written to hidden-gems-result.json");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
