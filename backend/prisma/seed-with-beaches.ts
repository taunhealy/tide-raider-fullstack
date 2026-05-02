/**
 * Adapted seed script for backend that includes beach data
 * This script can be run from the backend container via SSH
 *
 * To use:
 * 1. Copy beachData.ts to backend/src/data/beachData.ts
 * 2. Copy constants.ts to backend/src/lib/location/countries/constants.ts
 * 3. Run: flyctl ssh console --app tide-raider-backend --command "npx tsx prisma/seed-with-beaches.ts"
 */

import * as dotenv from "dotenv";
import path from "path";

// Load environment variables, prioritizing .env.local if it exists
const envLocalPath = path.join(__dirname, "../.env.local");
const envPath = path.join(__dirname, "../.env");
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

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
import { join } from "path";
import { existsSync } from "fs";

// Get __dirname - available at runtime in CommonJS (tsconfig uses "module": "CommonJS")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pathNode = require("path");
// In CommonJS, __dirname is available at runtime, but TypeScript may not recognize it
// Use a fallback to process.cwd() if __dirname is not available
const currentDir = (() => {
  // @ts-ignore - __dirname exists at runtime in CommonJS
  return typeof __dirname !== "undefined"
    ? __dirname
    : pathNode.join(process.cwd(), "prisma");
})();

// Create PrismaClient with connection pooler support (disable prepared statements)
// Supabase pooler doesn't support prepared statements, so we add ?pgbouncer=true
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || "";
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // If using pooler (port 6543), add pgbouncer=true to disable prepared statements
  if (url.includes(":6543") && !url.includes("pgbouncer=true")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}pgbouncer=true`;
  }

  return url;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

// Helper function to load data (avoids top-level await)
async function loadData() {
  let beachData: any[] = [];
  let HARDCODED_COUNTRIES: any[] = [];

  try {
    const fs = require('fs');
    const path = require('path');
    
    // Define the continents to load
    const continents = ["africa", "asia", "europe", "north-america", "oceania", "south-america"];
    
    // Path to the continents directory in the backend
    const backendDataPath = path.join(__dirname, "../src/data/continents");
    
    console.log(`Loading beach data from JSON files in: ${backendDataPath}`);
    
    for (const continent of continents) {
      const jsonPath = path.join(backendDataPath, `${continent}.json`);
      if (fs.existsSync(jsonPath)) {
        try {
          const rawData = fs.readFileSync(jsonPath, "utf8");
          const data = JSON.parse(rawData);
          beachData = [...beachData, ...data];
          console.log(`✓ Loaded ${data.length} beaches from ${continent}.json`);
        } catch (err) {
          console.error(`Error reading ${jsonPath}:`, err);
        }
      } else {
        console.warn(`⚠️ Continent file not found: ${jsonPath}`);
      }
    }
  } catch (error: any) {
    console.warn("⚠️ Could not load beachData from JSON. Beach seeding might be incomplete.");
    console.warn(`   Error: ${error.message}`);
    beachData = [];
  }

  try {
    const countriesModule = await import(
      "../src/lib/location/countries/constants"
    );
    HARDCODED_COUNTRIES = countriesModule.HARDCODED_COUNTRIES || [];
    console.log(`✓ Loaded ${HARDCODED_COUNTRIES.length} countries`);
  } catch (error) {
    console.warn("⚠️ Could not load HARDCODED_COUNTRIES. Using fallback.");
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

  return { beachData, HARDCODED_COUNTRIES };
}

// All the mapping functions (same as frontend seed)
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
    console.log("🌱 Starting full seed with beaches...");

    // Load data first - use Promise.resolve to handle dynamic imports
    let beachData: any[] = [];
    let HARDCODED_COUNTRIES: any[] = [];

    try {
      const loadResult = await loadData();
      beachData = loadResult.beachData;
      HARDCODED_COUNTRIES = loadResult.HARDCODED_COUNTRIES;
    } catch (loadError) {
      console.error("Failed to load data:", loadError);
      throw loadError;
    }

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
        console.warn(
          `Skipping country ${country.name}: Unknown continent ${country.continent}`
        );
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

    // 3. Extract and create regions
    console.log("3. Creating regions...");
    // Map beach country names/IDs to actual country IDs from HARDCODED_COUNTRIES
    const countryNameToId = new Map<string, string>();
    HARDCODED_COUNTRIES.forEach((c) => {
      countryNameToId.set(c.name, c.id);
      countryNameToId.set(c.id, c.id); // Also map ID to itself
    });

    const uniqueRegions = new Map<string, Set<string>>(); // countryId -> Set<regionName>

    // ISO 2-letter code mapping to our IDs
    const isoMap: Record<string, string> = {
      za: "za",
      na: "na",
      mz: "mz",
      mg: "mg",
      ao: "ao",
      ga: "ga",
      lr: "lr",
      id: "id",
      cr: "cr",
      au: "au",
      nz: "nz",
      sv: "sv",
      pe: "pe",
      es: "es",
      us: "us",
      gb: "gb",
      fo: "fo",
      ma: "ma",
      sn: "sn",
      yt: "yt",
      pt: "pt",
      fr: "fr",
      br: "br",
      mx: "mx",
      jp: "jp",
      fj: "fj",
      mv: "mv",
      cl: "cl",
      ni: "ni",
      pa: "pa",
      ph: "ph",
      lk: "lk",
      tw: "tw",
      th: "th",
      ie: "ie",
      ec: "ec",
    };

    if (beachData.length > 0) {
      beachData.forEach((beach) => {
        if (!beach.countryId || !beach.regionId) return;
        
        // Resolve beach.countryId through isoMap first, then countryNameToId
        const countryIdLower = beach.countryId.toLowerCase();
        const actualCountryId = isoMap[countryIdLower] || countryNameToId.get(beach.countryId) || countryNameToId.get(countryIdLower);
        
        if (!actualCountryId) return; 

        if (!uniqueRegions.has(actualCountryId)) {
          uniqueRegions.set(actualCountryId, new Set());
        }
        uniqueRegions.get(actualCountryId)!.add(beach.regionId);
      });
    }

    // Also add regions from REGION_CONFIGS - map old country codes to HARDCODED_COUNTRIES IDs
    const countryCodeMap: Record<string, string> = {
      za: "za",
      na: "na",
      mz: "mz",
      mg: "mg",
      ao: "ao",
      ga: "ga",
      lr: "lr",
      id: "id",
      cr: "cr",
      au: "au",
      nz: "nz",
      sv: "sv",
      pe: "pe",
      es: "es",
      us: "us",
      gb: "gb",
      fo: "fo",
      ma: "ma",
      sn: "sn",
      yt: "yt",
      zm: "zm",
    };

    const allRegions = [
      {
        id: "western-cape",
        name: "Western Cape",
        countryId: countryCodeMap["za"] || "south-africa",
      },
      {
        id: "eastern-cape",
        name: "Eastern Cape",
        countryId: countryCodeMap["za"] || "south-africa",
      },
      {
        id: "kwazulu-natal",
        name: "KwaZulu-Natal",
        countryId: countryCodeMap["za"] || "south-africa",
      },
      {
        id: "northern-cape",
        name: "Northern Cape",
        countryId: countryCodeMap["za"] || "south-africa",
      },
      {
        id: "swakopmund",
        name: "Swakopmund",
        countryId: countryCodeMap["na"] || "namibia",
      },
      {
        id: "inhambane-province",
        name: "Inhambane Province",
        countryId: countryCodeMap["mz"] || "mozambique",
      },
      {
        id: "ponta-do-ouro",
        name: "Ponta do Ouro",
        countryId: countryCodeMap["mz"] || "mozambique",
      },
      {
        id: "mozambique",
        name: "Mozambique",
        countryId: countryCodeMap["mz"] || "mozambique",
      },
      {
        id: "madagascar-south",
        name: "Madagascar South",
        countryId: countryCodeMap["mg"] || "madagascar",
      },
      {
        id: "madagascar-west",
        name: "Madagascar West",
        countryId: countryCodeMap["mg"] || "madagascar",
      },
      {
        id: "madagascar-east",
        name: "Madagascar East",
        countryId: countryCodeMap["mg"] || "madagascar",
      },
      {
        id: "luanda-province",
        name: "Luanda Province",
        countryId: countryCodeMap["ao"] || "angola",
      },
      {
        id: "benguela",
        name: "Benguela",
        countryId: countryCodeMap["ao"] || "angola",
      },
      {
        id: "gabon-coast",
        name: "Gabon Coast",
        countryId: countryCodeMap["ga"] || "gabon",
      },
      {
        id: "liberia",
        name: "Liberia",
        countryId: countryCodeMap["lr"] || "liberia",
      },
      {
        id: "bali",
        name: "Bali",
        countryId: countryCodeMap["id"] || "indonesia",
      },
      {
        id: "puntarenas-province",
        name: "Puntarenas Province",
        countryId: countryCodeMap["cr"] || "costa-rica",
      },
      {
        id: "queensland",
        name: "Queensland",
        countryId: countryCodeMap["au"] || "australia",
      },
      {
        id: "new-south-wales",
        name: "New South Wales",
        countryId: countryCodeMap["au"] || "australia",
      },
      {
        id: "waikato",
        name: "Waikato",
        countryId: countryCodeMap["nz"] || "new-zealand",
      },
      {
        id: "san-salvador",
        name: "San Salvador",
        countryId: countryCodeMap["sv"] || "el-salvador",
      },
      {
        id: "costa-del-balsamo",
        name: "Costa del Balsamo",
        countryId: countryCodeMap["sv"] || "el-salvador",
      },
      {
        id: "chicama",
        name: "Chicama",
        countryId: countryCodeMap["pe"] || "peru",
      },
      {
        id: "andalucia",
        name: "Andalucia",
        countryId: countryCodeMap["es"] || "spain",
      },
      {
        id: "granada",
        name: "Granada",
        countryId: countryCodeMap["es"] || "spain",
      },
      {
        id: "california",
        name: "California",
        countryId: countryCodeMap["us"] || "united-states",
      },
      {
        id: "scotland",
        name: "Scotland",
        countryId: countryCodeMap["gb"] || "united-kingdom",
      },
      {
        id: "suðuroy",
        name: "Suðuroy",
        countryId: countryCodeMap["fo"] || "faroe-islands",
      },
      {
        id: "streymoy",
        name: "Streymoy",
        countryId: countryCodeMap["fo"] || "faroe-islands",
      },
      {
        id: "sandoy",
        name: "Sandoy",
        countryId: countryCodeMap["fo"] || "faroe-islands",
      },
      {
        id: "central-morocco",
        name: "Central Morocco",
        countryId: countryCodeMap["ma"] || "morocco",
      },
      {
        id: "morocco",
        name: "Morocco",
        countryId: countryCodeMap["ma"] || "morocco",
      },
      {
        id: "dakar",
        name: "Dakar",
        countryId: countryCodeMap["sn"] || "senegal",
      },
      {
        id: "mayotte",
        name: "Mayotte",
        countryId: countryCodeMap["yt"] || "mayotte",
      },
      // Zambia not in HARDCODED_COUNTRIES, skip for now
    ];

    const regionEntries: { id: string; name: string; countryId: string }[] = [];

    // From beach data
    uniqueRegions.forEach((regions, countryId) => {
      const country = HARDCODED_COUNTRIES.find(
        (c) => c.id === countryId || c.name === countryId
      );
      if (!country) return;

      regions.forEach((regionName: string) => {
        const regionId = transformRegionToId(regionName);
        if (!regionEntries.find((r) => r.id === regionId)) {
          regionEntries.push({
            id: regionId,
            name: regionName,
            countryId: country.id,
          });
        }
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

      console.log(`Processing ${beachData.length} beaches...`);
      for (const beach of beachData) {
        try {
          if (!beach.countryId || !beach.regionId) {
            if (skippedCount < 5) {
              console.warn(
                `Skipping beach ${beach.name}: Missing countryId or regionId`
              );
            }
            skippedCount++;
            continue;
          }

          // Resolve beach.countryId through isoMap first, then find in HARDCODED_COUNTRIES
          const countryIdLower = beach.countryId?.toLowerCase() || "";
          const resolvedCountryId = isoMap[countryIdLower] || beach.countryId;

          const country = HARDCODED_COUNTRIES.find(
            (c) => c.id === resolvedCountryId || c.id === beach.countryId || c.name === beach.countryId || c.name.toLowerCase() === countryIdLower
          );

          if (!country) {
            if (skippedCount < 5 || beach.id === 'skeleton-bay') {
              console.warn(
                `Skipping beach ${beach.name}: Country not found for countryId: ${beach.countryId} (resolved: ${resolvedCountryId})`
              );
            }
            skippedCount++;
            continue;
          }

          const regionId = transformRegionToId(beach.regionId);
          
          // Look up proper region name from allRegions (which has correct names like "Western Cape")
          // If not found, format the regionId to a proper name (e.g., "western-cape" -> "Western Cape")
          const predefinedRegion = allRegions.find((r) => r.id === regionId);
          const regionName = predefinedRegion?.name || 
            regionId
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");

          // Ensure region exists (create or update if needed) instead of skipping the beach
          // Only update name if it's not already set or if we have a better name from allRegions
          const existingRegion = await prisma.region.findUnique({
            where: { id: regionId },
            select: { name: true },
          });

          const region = await prisma.region.upsert({
            where: { id: regionId },
            update: {
              // Only update name if it's currently in snake_case or if we have a predefined name
              name: existingRegion?.name && 
                    existingRegion.name !== regionId && 
                    !existingRegion.name.includes("-") 
                    ? existingRegion.name  // Keep existing proper name
                    : regionName,  // Use proper name from allRegions or formatted name
              countryId: country.id,
            },
            create: {
              id: regionId,
              name: regionName,
              countryId: country.id,
            },
          });

          // Debug: log first successful beach
          if (createdCount === 0) {
            console.log(
              `✓ Creating first beach: ${beach.name} (country: ${country.id}, region: ${region.id})`
            );
          }

          // Extract condition data
          const optimalWindDirections = beach.conditionProfiles?.GENERAL?.optimalWindDirections || beach.optimalWindDirections || [];
          const optimalSwellDirections = beach.conditionProfiles?.GENERAL?.optimalSwellDirections || beach.optimalSwellDirections || {};
          const optimalTide = beach.conditionProfiles?.GENERAL?.optimalTide || beach.optimalTide || "ALL";
          const swellSize = beach.conditionProfiles?.GENERAL?.swellSize || beach.swellSize || {};
          const idealSwellPeriod = beach.conditionProfiles?.GENERAL?.idealSwellPeriod || beach.idealSwellPeriod || {};

          await prisma.beach.upsert({
            where: { id: beach.id },
            update: {
              name: beach.name,
              continent: beach.continent,
              countryId: country.id,
              regionId: region.id,
              location: beach.location,
              distanceFromCT: beach.distanceFromCT,
              bestSeasons:
                beach.bestSeasons?.map((season: string) => mapSeason(season)) ||
                [],
              description: beach.description,
              difficulty: mapDifficulty(beach.difficulty),
              waveType: mapWaveType(beach.waveType),
              waterTemp: beach.waterTemp,
              hazards: mapHazards(beach.hazards || []),
              crimeLevel: mapCrimeLevel(beach.crimeLevel as string),
              sharkAttack: mapSharkRisk(beach.sharkAttack),
              bestMonthOfYear: mapMonth(beach.bestMonthOfYear),
              coordinates: beach.coordinates,
              videos: beach.videos || [],
              isHiddenGem: beach.isHiddenGem,
              isFoiling: beach.isFoiling || false,
              isLongboarding: beach.isLongboarding || false,
              conditionProfiles: {
                deleteMany: { category: 'GENERAL' },
                create: {
                  category: 'GENERAL',
                  optimalWindDirections: optimalWindDirections,
                  optimalSwellDirections: optimalSwellDirections,
                  optimalTide: mapOptimalTide(optimalTide as string),
                  swellSize: swellSize,
                  idealSwellPeriod: idealSwellPeriod,
                }
              }
            },
            create: {
              id: beach.id,
              name: beach.name,
              continent: beach.continent,
              countryId: country.id,
              regionId: region.id,
              location: beach.location,
              distanceFromCT: beach.distanceFromCT,
              bestSeasons:
                beach.bestSeasons?.map((season: string) => mapSeason(season)) ||
                [],
              description: beach.description,
              difficulty: mapDifficulty(beach.difficulty),
              waveType: mapWaveType(beach.waveType),
              waterTemp: beach.waterTemp,
              hazards: mapHazards(beach.hazards || []),
              crimeLevel: mapCrimeLevel(beach.crimeLevel as string),
              sharkAttack: mapSharkRisk(beach.sharkAttack),
              bestMonthOfYear: mapMonth(beach.bestMonthOfYear),
              coordinates: beach.coordinates,
              videos: beach.videos || [],
              isHiddenGem: beach.isHiddenGem,
              isFoiling: beach.isFoiling || false,
              isLongboarding: beach.isLongboarding || false,
              conditionProfiles: {
                create: {
                  category: 'GENERAL',
                  optimalWindDirections: optimalWindDirections,
                  optimalSwellDirections: optimalSwellDirections,
                  optimalTide: mapOptimalTide(optimalTide as string),
                  swellSize: swellSize,
                  idealSwellPeriod: idealSwellPeriod,
                }
              }
            },
          });

          if (beach.id === 'dungeons') {
             console.log(`DEBUG: Processing Dungeons. isHiddenGem in data: ${beach.isHiddenGem}`);
          }

          createdCount++;
          if (createdCount % 50 === 0) {
            console.log(
              `Progress: ${createdCount}/${beachData.length} beaches processed...`
            );
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

    // 5. Create users with credits
    console.log("5. Creating or finding users with credits...");
    
    // Seed Tide Raider production user
    await prisma.user.upsert({
      where: { email: "admin@tideraider.com" },
      update: { credits: 300 },
      create: {
        id: "cmnhjq35d000cs60fxss02p4o",
        name: "Tide Raider",
        email: "admin@tideraider.com",
        roles: ["SURFER"],
        credits: 300,
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: new Date("2030-01-01"),
      },
    });
    console.log("✓ Seeded Tide Raider admin user with 300 credits");

    // Seed Taunhealy account with 300 credits
    await prisma.user.upsert({
      where: { email: "taunhealy@gmail.com" },
      update: { credits: 300 },
      create: {
        id: "cmn4owtab0000s60f0dosfbck",
        name: "Taun",
        email: "taunhealy@gmail.com",
        roles: ["SURFER"],
        credits: 300,
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: new Date("2030-01-01"),
      },
    });
    console.log("✓ Seeded Taunhealy user with 300 credits");

    let user = await prisma.user.findFirst({
      where: { email: "taunhealy@gmail.com" }
    });

    if (!user) {
      user = await prisma.user.findFirst();
    }

    // 6. Create log entries (if beaches exist)
    const beach = await prisma.beach.findFirst({
      include: { region: true },
    });

    if (beach) {
      console.log("6. Creating log entries...");
      for (const entry of sampleLogEntries) {
        try {
          const forecast = await prisma.forecast.create({
            data: {
              date: entry.date,
              source: "WINDFINDER",
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
              user: { connect: { id: user?.id } },
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

    console.log("✅ Full seed with beaches completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Seed failed with error:", e);
  process.exit(1);
});
