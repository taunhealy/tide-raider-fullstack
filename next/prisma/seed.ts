import { PrismaClient, Prisma } from "@prisma/client";
import { beachData } from "../app/types/beaches";

const prisma = new PrismaClient();

function getContinent(country: string): string {
  // Get all unique continents from beach data
  const continentMap: Record<string, string> = {};

  // Build the map from actual beach data
  beachData.forEach((beach) => {
    if (beach.country && beach.continent) {
      continentMap[beach.country] = beach.continent;
    }
  });

  const continent = continentMap[country];
  if (!continent) {
    console.error(
      `No continent mapping found for country: ${country}, defaulting to Africa`
    );
    return "Africa"; // Default to a valid continent
  }
  return continent;
}

async function main() {
  console.log("Starting to seed countries...");

  console.log("Starting to seed continents...");

  // Get unique continents from beach data
  const uniqueContinents = [
    ...new Set(beachData.map((beach) => beach.continent)),
  ];

  for (const continent of uniqueContinents) {
    const continentId = continent.toLowerCase().replace(/\s+/g, "-");
    console.log(`Creating continent: ${continent} with ID: ${continentId}`);

    await prisma.continent.upsert({
      where: { id: continentId },
      update: { name: continent },
      create: {
        id: continentId,
        name: continent,
      },
    });
  }

  // Create countries first
  const countries = [...new Set(beachData.map((beach) => beach.country))];
  for (const countryName of countries) {
    const countryId = countryName.toLowerCase().replace(/\s+/g, "-");
    await prisma.country.upsert({
      where: { id: countryId },
      update: {
        name: countryName,
        continent: {
          connect: {
            id: getContinent(countryName).toLowerCase().replace(/\s+/g, "-"),
          },
        },
      },
      create: {
        id: countryId,
        name: countryName,
        continent: {
          connect: {
            id: getContinent(countryName).toLowerCase().replace(/\s+/g, "-"),
          },
        },
      },
    });
  }

  console.log("Starting to seed regions...");

  // Create regions next
  const uniqueRegions = [...new Set(beachData.map((beach) => beach.region))];
  for (const region of uniqueRegions) {
    const beachWithRegion = beachData.find((b) => b.region === region);
    if (!beachWithRegion) continue;

    const countryId = beachWithRegion.country
      .toLowerCase()
      .replace(/\s+/g, "-");

    await prisma.region.upsert({
      where: { id: region },
      update: {
        name: region,
        countryId: countryId,
      },
      create: {
        id: region,
        name: region,
        countryId: countryId,
      },
    });
  }

  console.log("Starting to seed beaches...");

  // Finally create beaches
  for (const beach of beachData) {
    const countryId = beach.country.toLowerCase().replace(/\s+/g, "-");

    await prisma.beach.upsert({
      where: { id: beach.id },
      update: {
        name: beach.name,
        continent: beach.continent,
        countryId: countryId,
        regionId: beach.region,
        location: beach.location,
        distanceFromCT: beach.distanceFromCT,
        optimalWindDirections: beach.optimalWindDirections,
        optimalSwellDirections:
          beach.optimalSwellDirections as unknown as Prisma.InputJsonValue,
        bestSeasons: beach.bestSeasons,
        optimalTide: beach.optimalTide,
        description: beach.description,
        difficulty: beach.difficulty,
        waveType: beach.waveType,
        swellSize: beach.swellSize as unknown as Prisma.InputJsonValue,
        idealSwellPeriod:
          beach.idealSwellPeriod as unknown as Prisma.InputJsonValue,
        waterTemp: beach.waterTemp as unknown as Prisma.InputJsonValue,
        hazards: beach.hazards,
        crimeLevel: beach.crimeLevel,
        sharkAttack: beach.sharkAttack as unknown as Prisma.InputJsonValue,
        coordinates: beach.coordinates as unknown as Prisma.InputJsonValue,
        sheltered: beach.sheltered || false,
      },
      create: {
        id: beach.id,
        name: beach.name,
        continent: beach.continent,
        countryId: countryId,
        regionId: beach.region,
        location: beach.location,
        distanceFromCT: beach.distanceFromCT,
        optimalWindDirections: beach.optimalWindDirections,
        optimalSwellDirections:
          beach.optimalSwellDirections as unknown as Prisma.InputJsonValue,
        bestSeasons: beach.bestSeasons,
        optimalTide: beach.optimalTide,
        description: beach.description,
        difficulty: beach.difficulty,
        waveType: beach.waveType,
        swellSize: beach.swellSize as unknown as Prisma.InputJsonValue,
        idealSwellPeriod:
          beach.idealSwellPeriod as unknown as Prisma.InputJsonValue,
        waterTemp: beach.waterTemp as unknown as Prisma.InputJsonValue,
        hazards: beach.hazards,
        crimeLevel: beach.crimeLevel,
        sharkAttack: beach.sharkAttack as unknown as Prisma.InputJsonValue,
        coordinates: beach.coordinates as unknown as Prisma.InputJsonValue,
        sheltered: beach.sheltered || false,
      },
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
