import { PrismaClient, Prisma } from "@prisma/client";
import { beachData } from "../app/data/beachData";

const prisma = new PrismaClient();

function getContinent(country: string): string {
  // Get all unique continents from beach data
  const continentMap: Record<string, string> = {};

  // Build the map from actual beach data
  beachData.forEach((beach) => {
    if (beach.country && beach.region && beach.continent) {
      continentMap[beach.country.name] = beach.continent;
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
  console.log("Starting to seed continents...");

  // Transform beach data to match schema
  const transformedBeachData = beachData.map((beach) => {
    // If beach.country is an object, use its name, otherwise use the string directly
    const countryName =
      typeof beach.country === "object"
        ? beach.country.name
        : String(beach.country);
    const regionName =
      typeof beach.region === "object"
        ? beach.region.name
        : String(beach.region);

    const countryId = countryName.toLowerCase().replace(/\s+/g, "-");
    const regionId = `${regionName}-${countryName}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    return {
      ...beach,
      countryId,
      regionId,
      _originalCountry: countryName,
      _originalRegion: regionName,
    };
  });

  // Use transformedBeachData instead of beachData in the rest of the script
  const uniqueContinents = [
    ...new Set(transformedBeachData.map((beach) => beach.continent)),
  ];

  for (const continentName of uniqueContinents) {
    const continentId = continentName.toLowerCase().replace(/\s+/g, "-");
    await prisma.continent.upsert({
      where: { id: continentId },
      update: { name: continentName },
      create: {
        id: continentId,
        name: continentName,
      },
    });
  }

  // Create countries first
  const uniqueCountries = [
    ...new Set(transformedBeachData.map((beach) => beach._originalCountry)),
  ];
  for (const countryName of uniqueCountries) {
    const countryId = String(countryName).toLowerCase().replace(/\s+/g, "-");
    const continentId = transformedBeachData
      .find((b) => b._originalCountry === countryName)!
      .continent.toLowerCase()
      .replace(/\s+/g, "-");

    await prisma.country.upsert({
      where: { id: countryId },
      update: {
        name: countryName,
        continent: { connect: { id: continentId } },
      },
      create: {
        id: countryId,
        name: countryName,
        continent: { connect: { id: continentId } },
      },
    });
  }

  // Create regions next
  const uniqueRegions = [
    ...new Set(transformedBeachData.map((beach) => beach._originalRegion)),
  ];
  for (const regionName of uniqueRegions) {
    const beachWithRegion = transformedBeachData.find(
      (b) => b._originalRegion === regionName
    )!;
    const regionId = beachWithRegion.regionId;
    const countryId = beachWithRegion.countryId;

    await prisma.region.upsert({
      where: { id: regionId },
      update: {
        name: regionName,
        countryId: countryId,
      },
      create: {
        id: regionId,
        name: regionName,
        countryId: countryId,
      },
    });
  }

  // Finally create beaches
  for (const beach of transformedBeachData) {
    await prisma.beach.upsert({
      where: { id: beach.id },
      update: {
        name: beach.name,
        continent: beach.continent,
        countryId: beach.countryId,
        regionId: beach.regionId,
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
        videos:
          beach.videos?.map((video) => ({
            url: video.url,
            title: video.title,
            platform: video.platform,
          })) || ([] as Prisma.InputJsonValue),
        coffeeShop:
          beach.coffeeShop?.map((shop) => ({
            name: shop.name,
          })) || ([] as Prisma.InputJsonValue),
      },
      create: {
        id: beach.id,
        name: beach.name,
        continent: beach.continent,
        countryId: beach.countryId,
        regionId: beach.regionId,
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
        videos:
          beach.videos?.map((video) => ({
            url: video.url,
            title: video.title,
            platform: video.platform,
          })) || ([] as Prisma.InputJsonValue),
        coffeeShop:
          beach.coffeeShop?.map((shop) => ({
            name: shop.name,
          })) || ([] as Prisma.InputJsonValue),
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
