import { beachData } from "@/app/data/beachData";
import { HARDCODED_COUNTRIES } from "../app/lib/location/countries/constants";
import { prisma } from "@/app/lib/prisma";
import { Difficulty, WaveType, OptimalTide } from "@prisma/client";

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

// Add a utility function to map your data to Prisma enums
function mapDifficulty(value: string): Difficulty {
  const map: Record<string, Difficulty> = {
    BEGINNER: "BEGINNER",
    INTERMEDIATE: "INTERMEDIATE",
    ADVANCED: "ADVANCED",
    EXPERT: "EXPERT",
    // Add any other mappings needed
  };
  return map[value] || "INTERMEDIATE"; // Default fallback
}

function mapWaveType(value: string): WaveType {
  const map: Record<string, WaveType> = {
    BEACH_BREAK: "BEACH_BREAK",
    POINT_BREAK: "POINT_BREAK",
    REEF_BREAK: "REEF_BREAK",
    RIVER_MOUTH: "RIVER_MOUTH",
    // Add any other mappings needed
  };
  return map[value] || "BEACH_BREAK"; // Default fallback
}

function mapOptimalTide(value: string): OptimalTide {
  const map: Record<string, OptimalTide> = {
    All: "ALL",
    "All Tides": "ALL",
    Mid: "MID",
    "Mid Tide": "MID",
    Low: "LOW",
    "Low Tide": "LOW",
    High: "HIGH",
    "High Tide": "HIGH",
    "Low to Mid": "LOW_TO_MID",
    "Mid to High": "MID_TO_HIGH",
    // Add any other mappings needed
  };
  return map[value] || "UNKNOWN"; // Default fallback
}

// Add this near the top of your seed.ts file
const sampleLogEntries = [
  {
    date: new Date("2024-03-20"),
    surferName: "Dummy Surfer 1",
    surferEmail: "dummy.surfer1@example.com",
    beachName: "[DUMMY] Muizenberg",
    surferRating: 5,
    comments: "[DUMMY DATA] Perfect offshore conditions, clean 4-6ft waves",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-19"),
    surferName: "Dummy Surfer 2",
    surferEmail: "dummy.surfer2@example.com",
    beachName: "[DUMMY] Jeffreys Bay",
    surferRating: 4,
    comments: "[DUMMY DATA] Fun morning session, light crowd",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-18"),
    surferName: "Dummy Surfer 3",
    surferEmail: "dummy.surfer3@example.com",
    beachName: "[DUMMY] Victoria Bay",
    surferRating: 3,
    comments: "[DUMMY DATA] Bit choppy but still manageable",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-17"),
    surferName: "Dummy Surfer 4",
    surferEmail: "dummy.surfer4@example.com",
    beachName: "[DUMMY] Nahoon Reef",
    surferRating: 5,
    comments: "[DUMMY DATA] Epic dawn patrol, glassy conditions",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-16"),
    surferName: "Dummy Surfer 5",
    surferEmail: "dummy.surfer5@example.com",
    beachName: "[DUMMY] Cape St Francis",
    surferRating: 4,
    comments: "[DUMMY DATA] Good size waves, afternoon session",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-15"),
    surferName: "Dummy Surfer 6",
    surferEmail: "dummy.surfer6@example.com",
    beachName: "[DUMMY] Elands Bay",
    surferRating: 2,
    comments: "[DUMMY DATA] Onshore winds made it messy",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-14"),
    surferName: "Dummy Surfer 7",
    surferEmail: "dummy.surfer7@example.com",
    beachName: "[DUMMY] Supertubes",
    surferRating: 5,
    comments: "[DUMMY DATA] Perfect peeling rights, long rides",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-13"),
    surferName: "Dummy Surfer 8",
    surferEmail: "dummy.surfer8@example.com",
    beachName: "[DUMMY] Stilbaai",
    surferRating: 4,
    comments: "[DUMMY DATA] Clean morning waves, light offshore",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-12"),
    surferName: "Dummy Surfer 9",
    surferEmail: "dummy.surfer9@example.com",
    beachName: "[DUMMY] Buffels Bay",
    surferRating: 3,
    comments: "[DUMMY DATA] Average conditions but fun session",
    isPrivate: false,
    isAnonymous: false,
  },
  {
    date: new Date("2024-03-11"),
    surferName: "Dummy Surfer 10",
    surferEmail: "dummy.surfer10@example.com",
    beachName: "[DUMMY] Dungeons",
    surferRating: 5,
    comments: "[DUMMY DATA] Pumping swell, perfect conditions",
    isPrivate: false,
    isAnonymous: false,
  },
];

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
              optimalTide: mapOptimalTide(beach.optimalTide as string),
              description: beach.description,
              difficulty: mapDifficulty(beach.difficulty),
              waveType: mapWaveType(beach.waveType),
              swellSize: beach.swellSize,
              idealSwellPeriod: beach.idealSwellPeriod,
              waterTemp: beach.waterTemp,
              hazards: beach.hazards,
              crimeLevel: beach.crimeLevel as string,
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

    console.log("5. Creating or finding a user...");
    let user;
    try {
      // Try to find an existing user
      user = await prisma.user.findFirst();

      if (!user) {
        // Create a new user if none exists
        user = await prisma.user.create({
          data: {
            name: "Demo User",
            email: "demo@example.com",
            roles: ["SURFER"],
            skillLevel: "INTERMEDIATE",
          },
        });
        console.log("✓ Created new user:", user.id);
      } else {
        console.log("✓ Found existing user:", user.id);
      }
    } catch (error) {
      console.error("Failed to create/find user:", error);
      throw error;
    }

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
    // Create log entries
    for (const entry of sampleLogEntries) {
      try {
        // Create a forecast for this entry
        const forecast = await prisma.forecastA.create({
          data: {
            date: entry.date,
            region: {
              connect: { id: beach.region.id },
            },
            windSpeed: Math.floor(Math.random() * 20) + 5, // Random wind speed 5-25
            windDirection: Math.floor(Math.random() * 360), // Random direction 0-360
            swellHeight: Math.random() * 3 + 0.5, // Random swell 0.5-3.5m
            swellPeriod: Math.floor(Math.random() * 8) + 8, // Random period 8-16s
            swellDirection: Math.floor(Math.random() * 360), // Random direction 0-360
          },
        });

        // Create the log entry
        await prisma.logEntry.create({
          data: {
            date: entry.date,
            surferName: entry.surferName,
            surferEmail: entry.surferEmail,
            beachName: entry.beachName,
            surferRating: entry.surferRating,
            comments: entry.comments,
            isPrivate: entry.isPrivate,
            isAnonymous: entry.isAnonymous,
            user: { connect: { id: user.id } },
            beach: { connect: { id: beach.id } },
            region: { connect: { id: beach.region.id } },
            forecast: { connect: { id: forecast.id } },
          },
        });

        console.log(`Created log entry for ${entry.date}`);
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
