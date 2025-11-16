/**
 * Full seed script for backend database
 * This script seeds: continents, countries, regions, beaches, users, and log entries
 * 
 * To use frontend data, we need to import from the frontend directory.
 * Run this from the backend directory with: npx tsx prisma/seed-full.ts
 * 
 * Note: This requires the frontend data files to be accessible.
 * For production, consider copying beachData.ts to backend/src/data/
 */

import { PrismaClient } from "@prisma/client";
import {
  Difficulty,
  WaveType,
  OptimalTide,
  CrimeLevel,
  Season,
  Month,
  Hazard,
  SharkRisk,
} from "@prisma/client";

const prisma = new PrismaClient();

// Try to import from frontend (adjust path as needed)
// For now, we'll create a version that works with the data we have
let beachData: any[] = [];
let HARDCODED_COUNTRIES: any[] = [];

try {
  // Try importing from frontend (when running from project root)
  const beachDataModule = await import("../../next/app/data/beachData");
  beachData = beachDataModule.beachData || [];
  console.log(`✓ Loaded ${beachData.length} beaches from frontend data`);
} catch (error) {
  console.warn("⚠️ Could not load beachData from frontend. Beach seeding will be skipped.");
  console.warn("   To seed beaches, ensure beachData.ts is accessible or copy it to backend/src/data/");
}

try {
  const countriesModule = await import("../../next/app/lib/location/countries/constants");
  HARDCODED_COUNTRIES = countriesModule.HARDCODED_COUNTRIES || [];
  console.log(`✓ Loaded ${HARDCODED_COUNTRIES.length} countries from frontend data`);
} catch (error) {
  console.warn("⚠️ Could not load HARDCODED_COUNTRIES. Using fallback list.");
  // Fallback countries list
  HARDCODED_COUNTRIES = [
    { id: "za", name: "South Africa", continent: "Africa" },
    { id: "na", name: "Namibia", continent: "Africa" },
    { id: "mz", name: "Mozambique", continent: "Africa" },
    { id: "mg", name: "Madagascar", continent: "Africa" },
    { id: "ao", name: "Angola", continent: "Africa" },
    { id: "ga", name: "Gabon", continent: "Africa" },
    { id: "lr", name: "Liberia", continent: "Africa" },
    { id: "id", name: "Indonesia", continent: "Asia" },
    { id: "cr", name: "Costa Rica", continent: "North America" },
    { id: "au", name: "Australia", continent: "Oceania" },
    { id: "nz", name: "New Zealand", continent: "Oceania" },
    { id: "sv", name: "El Salvador", continent: "North America" },
    { id: "pe", name: "Peru", continent: "South America" },
    { id: "es", name: "Spain", continent: "Europe" },
    { id: "us", name: "United States", continent: "North America" },
    { id: "gb", name: "United Kingdom", continent: "Europe" },
    { id: "fo", name: "Faroe Islands", continent: "Europe" },
    { id: "ma", name: "Morocco", continent: "Africa" },
    { id: "sn", name: "Senegal", continent: "Africa" },
    { id: "yt", name: "Mayotte", continent: "Africa" },
    { id: "zm", name: "Zambia", continent: "Africa" },
  ];
}

// Helper functions (same as frontend seed)
function transformRegionToId(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, "-");
}

function mapDifficulty(value: string): Difficulty {
  const map: Record<string, Difficulty> = {
    BEGINNER: "BEGINNER",
    INTERMEDIATE: "INTERMEDIATE",
    ADVANCED: "ADVANCED",
    EXPERT: "EXPERT",
  };
  return map[value] || "INTERMEDIATE";
}

function mapWaveType(value: string): WaveType {
  const map: Record<string, WaveType> = {
    BEACH_BREAK: "BEACH_BREAK",
    POINT_BREAK: "POINT_BREAK",
    REEF_BREAK: "REEF_BREAK",
    RIVER_MOUTH: "RIVER_MOUTH",
  };
  return map[value] || "BEACH_BREAK";
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
  };
  return map[value] || "UNKNOWN";
}

function mapCrimeLevel(value: string): CrimeLevel {
  const map: Record<string, CrimeLevel> = {
    Low: "LOW",
    Medium: "MEDIUM",
    High: "HIGH",
  };
  return map[value] || "LOW";
}

function mapSeason(value: string): Season {
  const upperValue = value.toUpperCase();
  const map: Record<string, Season> = {
    SUMMER: "SUMMER",
    AUTUMN: "AUTUMN",
    WINTER: "WINTER",
    SPRING: "SPRING",
  };
  return map[upperValue] || "SUMMER";
}

function mapMonth(value: string | undefined): Month | null {
  if (!value) return null;
  const map: Record<string, Month> = {
    January: "JANUARY",
    February: "FEBRUARY",
    March: "MARCH",
    April: "APRIL",
    May: "MAY",
    June: "JUNE",
    July: "JULY",
    August: "AUGUST",
    September: "SEPTEMBER",
    October: "OCTOBER",
    November: "NOVEMBER",
    December: "DECEMBER",
  };
  return map[value] || null;
}

function mapHazards(values: string[]): Hazard[] {
  const map: Record<string, Hazard> = {
    Rocks: "ROCKS",
    Currents: "CURRENTS",
    Sharks: "SHARKS",
    Jellyfish: "JELLYFISH",
    Pollution: "POLLUTION",
    Riptides: "RIPTIDES",
    "Shallow Reef": "SHALLOW_REEF",
    Localism: "LOCALISM",
    Crowds: "CROWDS",
    "Boat Traffic": "BOAT_TRAFFIC",
    "Strong Undertow": "STRONG_UNDERTOW",
    "Submerged Objects": "SUBMERGED_OBJECTS",
    "Rip currents": "CURRENTS",
  };
  return values.map((v) => map[v] || "ROCKS").filter(Boolean) as Hazard[];
}

function mapSharkRisk(value: any): SharkRisk {
  if (!value || typeof value !== "object") return "NONE";
  const risk = value.risk || (value.hasAttack ? "MODERATE" : "NONE");
  const map: Record<string, SharkRisk> = {
    None: "NONE",
    Low: "LOW",
    Moderate: "MODERATE",
    High: "HIGH",
    Extreme: "EXTREME",
  };
  return map[risk] || "NONE";
}

// Sample log entries
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
];

async function main() {
  try {
    console.log("🌱 Starting full seed script...");

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

    // 2. Create countries
    console.log("2. Creating countries...");
    const continentMap: Record<string, string> = {
      Africa: "AF",
      Europe: "EU",
      Asia: "AS",
      "North America": "NA",
      "South America": "SA",
      Oceania: "OC",
      Antarctica: "AN",
    };

    for (const country of HARDCODED_COUNTRIES) {
      const continentId = continentMap[country.continent];
      if (!continentId) {
        console.warn(`Skipping country ${country.name}: Unknown continent ${country.continent}`);
        continue;
      }

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
    }
    console.log(`✓ Created/updated ${HARDCODED_COUNTRIES.length} countries`);

    // 3. Extract and create regions from beach data
    console.log("3. Creating regions...");
    const uniqueRegions = new Map<string, Set<string>>();
    
    if (beachData.length > 0) {
      beachData.forEach((beach) => {
        if (!beach.countryId || !beach.regionId) return;
        if (!uniqueRegions.has(beach.countryId)) {
          uniqueRegions.set(beach.countryId, new Set());
        }
        uniqueRegions.get(beach.countryId)!.add(beach.regionId);
      });
    }

    // Also add regions from REGION_CONFIGS
    const allRegions = [
      { id: "western-cape", name: "Western Cape", countryId: "za" },
      { id: "eastern-cape", name: "Eastern Cape", countryId: "za" },
      { id: "kwazulu-natal", name: "KwaZulu-Natal", countryId: "za" },
      { id: "northern-cape", name: "Northern Cape", countryId: "za" },
      { id: "swakopmund", name: "Swakopmund", countryId: "na" },
      { id: "inhambane-province", name: "Inhambane Province", countryId: "mz" },
      { id: "ponta-do-ouro", name: "Ponta do Ouro", countryId: "mz" },
      { id: "mozambique", name: "Mozambique", countryId: "mz" },
      { id: "madagascar-south", name: "Madagascar South", countryId: "mg" },
      { id: "madagascar-west", name: "Madagascar West", countryId: "mg" },
      { id: "madagascar-east", name: "Madagascar East", countryId: "mg" },
      { id: "luanda-province", name: "Luanda Province", countryId: "ao" },
      { id: "benguela", name: "Benguela", countryId: "ao" },
      { id: "gabon-coast", name: "Gabon Coast", countryId: "ga" },
      { id: "liberia", name: "Liberia", countryId: "lr" },
      { id: "bali", name: "Bali", countryId: "id" },
      { id: "puntarenas-province", name: "Puntarenas Province", countryId: "cr" },
      { id: "queensland", name: "Queensland", countryId: "au" },
      { id: "new-south-wales", name: "New South Wales", countryId: "au" },
      { id: "waikato", name: "Waikato", countryId: "nz" },
      { id: "san-salvador", name: "San Salvador", countryId: "sv" },
      { id: "costa-del-balsamo", name: "Costa del Balsamo", countryId: "sv" },
      { id: "chicama", name: "Chicama", countryId: "pe" },
      { id: "andalucia", name: "Andalucia", countryId: "es" },
      { id: "granada", name: "Granada", countryId: "es" },
      { id: "california", name: "California", countryId: "us" },
      { id: "scotland", name: "Scotland", countryId: "gb" },
      { id: "suðuroy", name: "Suðuroy", countryId: "fo" },
      { id: "streymoy", name: "Streymoy", countryId: "fo" },
      { id: "sandoy", name: "Sandoy", countryId: "fo" },
      { id: "central-morocco", name: "Central Morocco", countryId: "ma" },
      { id: "morocco", name: "Morocco", countryId: "ma" },
      { id: "dakar", name: "Dakar", countryId: "sn" },
      { id: "mayotte", name: "Mayotte", countryId: "yt" },
      { id: "zambia", name: "Zambia", countryId: "zm" },
    ];

    // Create regions from both sources
    const regionEntries: { id: string; name: string; countryId: string }[] = [];
    
    // From beach data
    uniqueRegions.forEach((regions, countryId) => {
      const country = HARDCODED_COUNTRIES.find(
        (c) => c.id === countryId || c.name === countryId
      );
      if (!country) return;

      regions.forEach((regionName: string) => {
        const regionId = transformRegionToId(regionName);
        regionEntries.push({
          id: regionId,
          name: regionName,
          countryId: country.id,
        });
      });
    });

    // From allRegions (avoid duplicates)
    allRegions.forEach((region) => {
      if (!regionEntries.find((r) => r.id === region.id)) {
        regionEntries.push(region);
      }
    });

    for (const region of regionEntries) {
      await prisma.region.upsert({
        where: { id: region.id },
        update: {},
        create: region,
      });
    }
    console.log(`✓ Created/updated ${regionEntries.length} regions`);

    // 4. Create beaches (if beachData is available)
    if (beachData.length > 0) {
      console.log("4. Creating/updating beaches...");
      let createdCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const beach of beachData) {
        try {
          if (!beach.countryId || !beach.regionId) {
            skippedCount++;
            continue;
          }

          const country = HARDCODED_COUNTRIES.find(
            (c) => c.id === beach.countryId || c.name === beach.countryId
          );

          if (!country) {
            skippedCount++;
            continue;
          }

          const regionId = transformRegionToId(beach.regionId);
          const region = await prisma.region.findFirst({
            where: {
              id: regionId,
              countryId: country.id,
            },
          });

          if (!region) {
            skippedCount++;
            continue;
          }

          await prisma.beach.upsert({
            where: { id: beach.id },
            update: {
              name: beach.name,
              continent: beach.continent,
              countryId: country.id,
              regionId: region.id,
              location: beach.location,
              distanceFromCT: beach.distanceFromCT,
              optimalWindDirections: beach.optimalWindDirections,
              optimalSwellDirections: beach.optimalSwellDirections,
              bestSeasons: beach.bestSeasons?.map((season) => mapSeason(season)) || [],
              optimalTide: mapOptimalTide(beach.optimalTide as string),
              description: beach.description,
              difficulty: mapDifficulty(beach.difficulty),
              waveType: mapWaveType(beach.waveType),
              swellSize: beach.swellSize,
              idealSwellPeriod: beach.idealSwellPeriod,
              waterTemp: beach.waterTemp,
              hazards: mapHazards(beach.hazards || []),
              crimeLevel: mapCrimeLevel(beach.crimeLevel as string),
              sharkAttack: mapSharkRisk(beach.sharkAttack),
              bestMonthOfYear: mapMonth(beach.bestMonthOfYear),
              coordinates: beach.coordinates,
              videos: beach.videos || [],
            },
            create: {
              id: beach.id,
              name: beach.name,
              continent: beach.continent,
              countryId: country.id,
              regionId: region.id,
              location: beach.location,
              distanceFromCT: beach.distanceFromCT,
              optimalWindDirections: beach.optimalWindDirections,
              optimalSwellDirections: beach.optimalSwellDirections,
              bestSeasons: beach.bestSeasons?.map((season) => mapSeason(season)) || [],
              optimalTide: mapOptimalTide(beach.optimalTide as string),
              description: beach.description,
              difficulty: mapDifficulty(beach.difficulty),
              waveType: mapWaveType(beach.waveType),
              swellSize: beach.swellSize,
              idealSwellPeriod: beach.idealSwellPeriod,
              waterTemp: beach.waterTemp,
              hazards: mapHazards(beach.hazards || []),
              crimeLevel: mapCrimeLevel(beach.crimeLevel as string),
              sharkAttack: mapSharkRisk(beach.sharkAttack),
              bestMonthOfYear: mapMonth(beach.bestMonthOfYear),
              coordinates: beach.coordinates,
              videos: beach.videos || [],
            },
          });

          createdCount++;
          if (createdCount % 50 === 0) {
            console.log(`Progress: ${createdCount}/${beachData.length} beaches processed...`);
          }
        } catch (error) {
          console.error(`Error upserting beach ${beach.name}:`, error);
          errorCount++;
        }
      }

      console.log(`✓ Beach processing complete:`);
      console.log(`  - Created/Updated: ${createdCount}`);
      console.log(`  - Skipped: ${skippedCount}`);
      console.log(`  - Errors: ${errorCount}`);
    } else {
      console.log("4. Skipping beach creation (beachData not available)");
    }

    // 5. Create user
    console.log("5. Creating or finding a user...");
    let user = await prisma.user.findFirst();

    if (!user) {
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

    // 6. Create log entries (if beaches exist)
    const beach = await prisma.beach.findFirst({
      include: { region: true },
    });

    if (beach) {
      console.log("6. Creating log entries...");
      for (const entry of sampleLogEntries) {
        try {
          const forecast = await prisma.forecastA.create({
            data: {
              date: entry.date,
              region: { connect: { id: beach.region.id } },
              windSpeed: Math.floor(Math.random() * 20) + 5,
              windDirection: Math.floor(Math.random() * 360),
              swellHeight: Math.random() * 3 + 0.5,
              swellPeriod: Math.floor(Math.random() * 8) + 8,
              swellDirection: Math.floor(Math.random() * 360),
            },
          });

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
        } catch (error) {
          console.error(`Failed to create entry for ${entry.date}:`, error);
        }
      }
      console.log("✓ Log entries created");
    } else {
      console.log("6. Skipping log entries (no beaches found)");
    }

    console.log("✅ Full seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  });

