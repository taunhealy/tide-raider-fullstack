import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

function transformRegionToId(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  try {
    console.log("🌱 Starting seed for Fly Postgres...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

    // 1. Create continents
    console.log("1. Creating continents...");
    const continents = [
      { id: "AF", name: "Africa" },
      { id: "EU", name: "Europe" },
      { id: "AS", name: "Asia" },
      { id: "NA", name: "North America" },
      { id: "SA", name: "South America" },
      { id: "OC", name: "Oceania" },
      { id: "AN", name: "Antarctica" },
    ];

    for (const continent of continents) {
      await prisma.continent.upsert({
        where: { id: continent.id },
        update: {},
        create: continent,
      });
    }
    console.log("✓ Continents created");

    // 2. Create South Africa
    console.log("2. Creating countries...");
    await prisma.country.upsert({
      where: { id: "za" },
      update: {},
      create: {
        id: "za",
        name: "South Africa",
        continentId: "AF",
      },
    });
    console.log("✓ Countries created");

    // 3. Create essential regions
    console.log("3. Creating regions...");
    const regions = [
      { name: "Western Cape", countryId: "za" },
      { name: "Eastern Cape", countryId: "za" },
      { name: "KwaZulu-Natal", countryId: "za" },
      { name: "Northern Cape", countryId: "za" },
    ];

    for (const region of regions) {
      const regionId = transformRegionToId(region.name);
      await prisma.region.upsert({
        where: { id: regionId },
        update: {},
        create: {
          id: regionId,
          name: region.name,
          countryId: region.countryId,
        },
      });
      console.log(`✓ Created/updated region: ${region.name} (${regionId})`);
    }

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

