import { PrismaClient } from "@prisma/client";
import { beachData } from "../app/types/beaches";

const prisma = new PrismaClient();

async function seedRegions() {
  console.log("Cleaning up existing regions with incorrect format...");

  // Delete regions with non-hyphenated IDs or spaces (the incorrect ones)
  const allRegions = await prisma.region.findMany();
  for (const region of allRegions) {
    if (region.id.includes(" ") || region.id !== region.id.toLowerCase()) {
      console.log(`Deleting region: ${region.id} (${region.name})`);

      try {
        await prisma.region.delete({
          where: { id: region.id },
        });
      } catch (error) {
        console.error(`Failed to delete region ${region.id}:`, error);
      }
    }
  }

  // Extract unique regions from beach data
  const uniqueRegions = [
    ...new Set(beachData.map((beach: any) => beach.region)),
  ];
  console.log(`Found ${uniqueRegions.length} unique regions in beach data`);

  // Format regions according to database schema
  const regionsToCreate = uniqueRegions.map((regionName) => ({
    id: regionName.toLowerCase().replace(/\s+/g, "-"),
    name: regionName,
    country:
      beachData.find((beach) => beach.region === regionName)?.country || "",
    continent:
      beachData.find((beach) => beach.region === regionName)?.continent || "",
  }));

  // Only create regions that don't already exist
  let createdCount = 0;
  let skippedCount = 0;

  for (const region of regionsToCreate) {
    // Check if region with this ID already exists
    const existingRegion = await prisma.region.findUnique({
      where: { id: region.id },
    });

    if (existingRegion) {
      // Skip existing region
      skippedCount++;
    } else {
      // Create new region
      await prisma.region.create({
        data: region,
      });
      createdCount++;
    }
  }

  console.log(
    `Seeded ${createdCount} new regions, skipped ${skippedCount} existing regions`
  );
}

async function seedBeaches() {
  console.log("Starting beach seeding...");

  // Process each beach from the beach data
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const beach of beachData) {
    try {
      // Format the beach ID
      const beachId = beach.name.toLowerCase().replace(/\s+/g, "-");

      // Check if beach already exists
      const existingBeach = await prisma.beach.findUnique({
        where: { id: beachId },
      });

      if (existingBeach) {
        skippedCount++;
        continue;
      }

      // Get the region ID
      const regionId = beach.region.toLowerCase().replace(/\s+/g, "-");

      // Format the beach data according to your schema
      const beachDataForPrisma = {
        id: beachId,
        name: beach.name,
        continent: beach.continent || "",
        country: beach.country || "",
        regionId: regionId,
        location: beach.location || "",
        distanceFromCT: beach.distanceFromCT || 0,
        optimalWindDirections: beach.optimalWindDirections || [],
        optimalSwellDirections: beach.optimalSwellDirections || {},
        bestSeasons: beach.bestSeasons || [],
        optimalTide: beach.optimalTide || "",
        description: beach.description || "",
        difficulty: beach.difficulty || "",
        waveType: beach.waveType || "",
        swellSize: beach.swellSize || {},
        idealSwellPeriod: beach.idealSwellPeriod || {},
        waterTemp: beach.waterTemp || {},
        hazards: beach.hazards || [],
        crimeLevel: beach.crimeLevel || "",
        sharkAttack: beach.sharkAttack
          ? JSON.parse(JSON.stringify(beach.sharkAttack))
          : null,
        image: beach.image || null,
        coordinates: beach.coordinates || {},
        videos: beach.videos || {},
        profileImage: beach.profileImage || null,
        advertisingPrice: beach.advertisingPrice || null,
        coffeeShop: beach.coffeeShop || {},
        hasSharkAlert: beach.hasSharkAlert || false,
        bestMonthOfYear: beach.bestMonthOfYear || null,
        isHiddenGem: beach.isHiddenGem || false,
        sheltered: beach.sheltered || false,
      };

      // Create the beach
      await prisma.beach.create({
        data: beachDataForPrisma,
      });

      createdCount++;
    } catch (error) {
      console.error(`Error seeding beach ${beach.name}:`, error);
      errorCount++;
    }
  }

  console.log(
    `Seeded ${createdCount} new beaches, skipped ${skippedCount} existing beaches, encountered ${errorCount} errors`
  );
}

async function main() {
  console.log("Starting seed operation...");
  await seedRegions();
  await seedBeaches();
  console.log("Seed operation completed");
}

main()
  .catch((e) => {
    console.error("Error during seed operation:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
