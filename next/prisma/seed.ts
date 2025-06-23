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
  try {
    console.log("1. Creating continents...");
    // 1. Create continents first
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

    console.log("2. Creating countries...");
    // 2. Create countries from constants file

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

    // Log how many countries we're about to create
    console.log(
      `Attempting to create ${HARDCODED_COUNTRIES.length} countries...`
    );

    for (const country of HARDCODED_COUNTRIES) {
      const continentId =
        continentMap[country.continent as keyof typeof continentMap];
      if (!continentId) {
        console.warn(
          `Skipping country ${country.name}: Unknown continent ${country.continent}`
        );
        continue;
      }

      try {
        console.log(`Creating/updating country: ${country.name}`);
        await prisma.country.upsert({
          where: { id: country.id },
          update: {
            name: country.name,
            continentId: continentId,
          },
          create: {
            id: country.id,
            name: country.name,
            continentId: continentId,
          },
        });
        console.log(`✓ Created/updated country: ${country.name}`);
      } catch (error) {
        console.error(
          `Failed to create/update country ${country.name}:`,
          error
        );
      }
    }

    console.log("✓ Countries creation completed");

    console.log("3. Creating regions...");
    // 3. Create regions based on beach data

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
    console.log("✓ Regions created");

    console.log("4. Checking if beaches exist...");
    const existingBeachCount = await prisma.beach.count();

    if (existingBeachCount === 0) {
      console.log("No beaches found, creating beaches...");
      // 4. Now create beaches
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
      console.log("✓ Beaches created");
    } else {
      console.log(
        `✓ ${existingBeachCount} beaches already exist, skipping beach creation`
      );
    }

    console.log("5. Checking user...");
    const userId = "cmc96jvht0000v0b0sic16ghk";
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("⚠️ User not found. Please create user first.");
    }
    console.log("✓ User found:", user.id);

    const beach = await prisma.beach.findFirst({
      include: {
        region: true,
      },
    });

    if (!beach) {
      throw new Error(
        "⚠️ No beaches found in database. Beach creation may have failed."
      );
    }
    console.log("✓ Found beach for log entries:", beach.name);

    console.log("6. Creating log entries...");
    // Get a random beach for the log entries
    const sampleLogEntries = [
      {
        date: new Date("2024-03-15"),
        surferRating: 4,
        comments: "Great morning session, clean waves",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-14"),
        surferRating: 5,
        comments: "Perfect conditions, offshore winds",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-13"),
        surferRating: 3,
        comments: "Bit choppy but still fun",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-12"),
        surferRating: 4,
        comments: "Early morning glass-off",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-11"),
        surferRating: 2,
        comments: "Crowded and messy",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-10"),
        surferRating: 5,
        comments: "Epic swell, perfect size",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-09"),
        surferRating: 4,
        comments: "Good size waves, light crowd",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-08"),
        surferRating: 3,
        comments: "Fun afternoon session",
        isPrivate: false,
        isAnonymous: false,
      },
      {
        date: new Date("2024-03-07"),
        surferRating: 4,
        comments: "Clean morning waves",
        isPrivate: false,
        isAnonymous: false,
      },
    ];

    for (const entry of sampleLogEntries) {
      try {
        console.log(`Creating forecast for date: ${entry.date}`);

        const forecast = await prisma.forecastA.create({
          data: {
            date: entry.date,
            region: {
              connect: { id: beach.region.id },
            },
            windSpeed: 15,
            windDirection: 180,
            swellHeight: 1.5,
            swellPeriod: 12,
            swellDirection: 200,
          },
        });

        console.log(`Creating log entry for date: ${entry.date}`);
        await prisma.logEntry.create({
          data: {
            date: entry.date,
            surferRating: entry.surferRating,
            comments: entry.comments,
            isPrivate: entry.isPrivate,
            isAnonymous: entry.isAnonymous,
            user: { connect: { id: userId } },
            beach: { connect: { id: beach.id } },
            region: { connect: { id: beach.region.id } },
            forecast: { connect: { id: forecast.id } },
          },
        });

        console.log(`✓ Created log entry and forecast for ${entry.date}`);
      } catch (error) {
        console.error(`Failed to create entry for ${entry.date}:`, error);
      }
    }

    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
