import { beachData } from "../app/data/beachData";
import { HARDCODED_COUNTRIES } from "../app/lib/location/countries/constants";
import { prisma } from "@/app/lib/prisma";

// Add this utility function to your seed.ts file
async function getCountryAndRegionIds(countryName: string, regionName: string) {
  // Find country by name
  const country = await prisma.country.findFirst({
    where: { name: countryName },
  });

  if (!country) {
    throw new Error(`Country not found: ${countryName}`);
  }

  // Find region by name and country
  const region = await prisma.region.findFirst({
    where: {
      name: regionName,
      countryId: country.id,
    },
  });

  if (!region) {
    throw new Error(
      `Region not found: ${regionName} in country ${countryName}`
    );
  }

  return {
    countryId: country.id,
    regionId: region.id,
  };
}

// Helper to extract unique countries and regions
const uniqueCountries = new Set();
const uniqueRegions = new Map();

beachData.forEach((beach) => {
  uniqueCountries.add(beach.country);
  if (!uniqueRegions.has(beach.country)) {
    uniqueRegions.set(beach.country, new Set());
  }
  uniqueRegions.get(beach.country).add(beach.region);
});

console.log("Countries:", Array.from(uniqueCountries));
uniqueRegions.forEach((regions, country) => {
  console.log(`Regions in ${country}:`, Array.from(regions));
});

// Add this utility function at the top of seed.ts
function transformRegionToId(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  // 1. Create continents first
  console.log("Creating continents...");
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

  // 2. Create countries from constants file
  console.log("Creating countries...");

  // Map continent names to IDs
  const continentMap = {
    Africa: "AF",
    Europe: "EU",
    Asia: "AS",
    "North America": "NA",
    "South America": "SA",
    Oceania: "OC",
    Antarctica: "AN",
  };

  for (const country of HARDCODED_COUNTRIES) {
    const continentId =
      continentMap[country.continent as keyof typeof continentMap];
    if (!continentId) {
      console.warn(
        `Unknown continent for country ${country.name}: ${country.continent}`
      );
      continue;
    }

    await prisma.country.upsert({
      where: { id: country.id },
      update: {},
      create: {
        id: country.id,
        name: country.name,
        continentId: continentId,
      },
    });
  }

  // 3. Create regions based on beach data
  console.log("Creating regions...");

  // Extract unique regions from beach data
  const regionEntries: { id: string; name: string; countryId: string }[] = [];
  uniqueRegions.forEach((regions, countryName) => {
    // Find the country ID
    const country = HARDCODED_COUNTRIES.find(
      (c) => c.name === String(countryName)
    );
    if (!country) {
      console.warn(`Country not found: ${countryName}`);
      return;
    }

    // Add all regions for this country
    regions.forEach((regionName: string) => {
      const regionId = transformRegionToId(regionName);
      regionEntries.push({
        id: regionId,
        name: regionName,
        countryId: country.id,
      });
    });
  });

  // Create all regions
  for (const region of regionEntries) {
    await prisma.region.upsert({
      where: { id: region.id },
      update: {},
      create: region,
    });
  }

  // 4. Now create beaches
  console.log("Creating beaches...");
  for (const beach of beachData) {
    try {
      // Find country
      const country = HARDCODED_COUNTRIES.find(
        (c) => c.name === String(beach.country)
      );
      if (!country) {
        console.warn(
          `Country not found for beach ${beach.name}: ${beach.country}`
        );
        continue;
      }

      // Find region
      const region = await prisma.region.findFirst({
        where: {
          id: transformRegionToId(beach.region as unknown as string),
          countryId: country.id,
        },
      });

      if (!region) {
        console.warn(
          `Region not found for beach ${beach.name}: ${beach.region}`
        );
        continue;
      }

      await prisma.beach.create({
        data: {
          id: beach.id,
          name: beach.name,
          continent: beach.continent,
          countryId: country.id,
          regionId: region.id,
          location: beach.location,
          distanceFromCT: beach.distanceFromCT,
          optimalWindDirections: beach.optimalWindDirections,
          optimalSwellDirections: beach.optimalSwellDirections,
          bestSeasons: beach.bestSeasons,
          optimalTide: beach.optimalTide,
          description: beach.description,
          difficulty: beach.difficulty,
          waveType: beach.waveType,
          swellSize: beach.swellSize,
          idealSwellPeriod: beach.idealSwellPeriod,
          waterTemp: beach.waterTemp,
          hazards: beach.hazards,
          crimeLevel: beach.crimeLevel,
          sharkAttack: beach.sharkAttack,
          coordinates: beach.coordinates,
          // Add any other required fields
        },
      });
      console.log(`Created beach: ${beach.name}`);
    } catch (error) {
      console.error(`Error creating beach ${beach.name}:`, error);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
