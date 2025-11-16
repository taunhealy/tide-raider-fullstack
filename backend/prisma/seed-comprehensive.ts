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

function transformRegionToId(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, "-");
}

// Mapping functions (same as frontend seed)
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

// HARDCODED_COUNTRIES from frontend
const HARDCODED_COUNTRIES = [
  { id: "au", name: "Australia", continent: "Oceania" },
  { id: "za", name: "South Africa", continent: "Africa" },
  { id: "id", name: "Indonesia", continent: "Asia" },
  { id: "us", name: "United States", continent: "North America" },
  { id: "pt", name: "Portugal", continent: "Europe" },
  { id: "fr", name: "France", continent: "Europe" },
  { id: "es", name: "Spain", continent: "Europe" },
  { id: "br", name: "Brazil", continent: "South America" },
  { id: "cr", name: "Costa Rica", continent: "North America" },
  { id: "mx", name: "Mexico", continent: "North America" },
  { id: "nz", name: "New Zealand", continent: "Oceania" },
  { id: "jp", name: "Japan", continent: "Asia" },
  { id: "ma", name: "Morocco", continent: "Africa" },
  { id: "fj", name: "Fiji", continent: "Oceania" },
  { id: "mv", name: "Maldives", continent: "Asia" },
  { id: "ao", name: "Angola", continent: "Africa" },
  { id: "mz", name: "Mozambique", continent: "Africa" },
  { id: "gb", name: "United Kingdom", continent: "Europe" },
  { id: "sv", name: "El Salvador", continent: "North America" },
  { id: "pe", name: "Peru", continent: "South America" },
  { id: "cl", name: "Chile", continent: "South America" },
  { id: "ni", name: "Nicaragua", continent: "North America" },
  { id: "pa", name: "Panama", continent: "North America" },
  { id: "ph", name: "Philippines", continent: "Asia" },
  { id: "lk", name: "Sri Lanka", continent: "Asia" },
  { id: "tw", name: "Taiwan", continent: "Asia" },
  { id: "th", name: "Thailand", continent: "Asia" },
  { id: "ie", name: "Ireland", continent: "Europe" },
  { id: "ic", name: "Canary Islands", continent: "Europe" },
  { id: "us-hi", name: "Hawaii", continent: "North America" },
  { id: "ec", name: "Ecuador", continent: "South America" },
  { id: "mg", name: "Madagascar", continent: "Africa" },
  { id: "ws", name: "Samoa", continent: "Oceania" },
  { id: "pf", name: "Tahiti", continent: "Oceania" },
  { id: "na", name: "Namibia", continent: "Africa" },
  { id: "ga", name: "Gabon", continent: "Africa" },
  { id: "lr", name: "Liberia", continent: "Africa" },
  { id: "sn", name: "Senegal", continent: "Africa" },
  { id: "yt", name: "Mayotte", continent: "Africa" },
  { id: "fo", name: "Faroe Islands", continent: "Europe" },
  { id: "zm", name: "Zambia", continent: "Africa" },
];

// All regions from REGION_CONFIGS
const ALL_REGIONS = [
  // South Africa
  { id: "western-cape", name: "Western Cape", countryId: "za" },
  { id: "eastern-cape", name: "Eastern Cape", countryId: "za" },
  { id: "kwazulu-natal", name: "KwaZulu-Natal", countryId: "za" },
  { id: "northern-cape", name: "Northern Cape", countryId: "za" },
  // Namibia
  { id: "swakopmund", name: "Swakopmund", countryId: "na" },
  // Mozambique
  { id: "inhambane-province", name: "Inhambane Province", countryId: "mz" },
  { id: "ponta-do-ouro", name: "Ponta do Ouro", countryId: "mz" },
  { id: "mozambique", name: "Mozambique", countryId: "mz" },
  // Madagascar
  { id: "madagascar-south", name: "Madagascar South", countryId: "mg" },
  { id: "madagascar-west", name: "Madagascar West", countryId: "mg" },
  { id: "madagascar-east", name: "Madagascar East", countryId: "mg" },
  // Angola
  { id: "luanda-province", name: "Luanda Province", countryId: "ao" },
  { id: "benguela", name: "Benguela", countryId: "ao" },
  // Gabon
  { id: "gabon-coast", name: "Gabon Coast", countryId: "ga" },
  // Liberia
  { id: "liberia", name: "Liberia", countryId: "lr" },
  // Indonesia
  { id: "bali", name: "Bali", countryId: "id" },
  // Costa Rica
  { id: "puntarenas-province", name: "Puntarenas Province", countryId: "cr" },
  // Australia
  { id: "queensland", name: "Queensland", countryId: "au" },
  { id: "new-south-wales", name: "New South Wales", countryId: "au" },
  // New Zealand
  { id: "waikato", name: "Waikato", countryId: "nz" },
  // El Salvador
  { id: "san-salvador", name: "San Salvador", countryId: "sv" },
  { id: "costa-del-balsamo", name: "Costa del Balsamo", countryId: "sv" },
  // Peru
  { id: "chicama", name: "Chicama", countryId: "pe" },
  // Spain
  { id: "andalucia", name: "Andalucia", countryId: "es" },
  { id: "granada", name: "Granada", countryId: "es" },
  // USA
  { id: "california", name: "California", countryId: "us" },
  // UK
  { id: "scotland", name: "Scotland", countryId: "gb" },
  // Faroe Islands
  { id: "suðuroy", name: "Suðuroy", countryId: "fo" },
  { id: "streymoy", name: "Streymoy", countryId: "fo" },
  { id: "sandoy", name: "Sandoy", countryId: "fo" },
  // Morocco
  { id: "central-morocco", name: "Central Morocco", countryId: "ma" },
  { id: "morocco", name: "Morocco", countryId: "ma" },
  // Senegal
  { id: "dakar", name: "Dakar", countryId: "sn" },
  // Mayotte
  { id: "mayotte", name: "Mayotte", countryId: "yt" },
  // Zambia
  { id: "zambia", name: "Zambia", countryId: "zm" },
];

async function main() {
  try {
    console.log("🌱 Starting comprehensive seed...");

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
      console.log(`✓ Created/updated country: ${country.name}`);
    }
    console.log(`✓ Created ${HARDCODED_COUNTRIES.length} countries`);

    // 3. Create regions
    console.log("3. Creating regions...");
    for (const region of ALL_REGIONS) {
      await prisma.region.upsert({
        where: { id: region.id },
        update: {},
        create: {
          id: region.id,
          name: region.name,
          countryId: region.countryId,
        },
      });
      console.log(`✓ Created/updated region: ${region.name} (${region.id})`);
    }
    console.log(`✓ Created ${ALL_REGIONS.length} regions`);

    console.log("✅ Comprehensive seed completed successfully!");
    console.log("📝 Note: Beach data seeding requires beachData file.");
    console.log("   To seed beaches, run the frontend seed script with DATABASE_URL pointing to backend database.");
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

