import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// 🔐 HARDCODED CREDENTIALS (Temporary for Seeding)
// ⚠️ WARNING: DO NOT COMMIT THIS FILE TO GIT!
const DATABASE_URL = "postgresql://postgres.pffssccmdbopnlgjdhwh:SupabaseIsSupafly@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const DIRECT_URL = "postgresql://postgres.pffssccmdbopnlgjdhwh:SupabaseIsSupafly@db.pffssccmdbopnlgjdhwh.supabase.co:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function main() {
  const continentArg = process.argv[2]?.toLowerCase();
  
  if (!continentArg) {
    console.error("Please provide a continent name (e.g., africa, asia, oceania) or 'all'");
    process.exit(1);
  }

  const dataDir = path.join(process.cwd(), "src/data/continents");
  let filesToProcess: string[] = [];

  if (continentArg === "all") {
    filesToProcess = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  } else {
    const filename = `${continentArg}.json`;
    if (fs.existsSync(path.join(dataDir, filename))) {
      filesToProcess = [filename];
    } else {
      console.error(`Continent file not found: ${filename}`);
      process.exit(1);
    }
  }

  console.log(`🚀 Starting seed for: ${continentArg.toUpperCase()}`);

  for (const file of filesToProcess) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"));
    console.log(`\nProcessing ${file} (${data.length} beaches)...`);

    for (const beach of data) {
      try {
        // Normalize fields for Prisma enums
        const normalizedBeach = {
          ...beach,
          distanceFromCT: beach.distanceFromCT ?? 0,
          bestSeasons: (beach.bestSeasons || []).flatMap((s: string) => {
            const val = String(s).toUpperCase().replace(/-/g, '_');
            if (val === "ALL" || val === "ALL_YEAR" || val === "YEAR_ROUND") return ["SUMMER", "AUTUMN", "WINTER", "SPRING"];
            if (val === "DRY" || val === "DRY_SEASON") return ["SUMMER", "AUTUMN"];
            if (val === "WET" || val === "WET_SEASON") return ["WINTER", "SPRING"];
            if (val === "FALL") return ["AUTUMN"];
            return [val];
          }).filter((s: string) => ["SUMMER", "AUTUMN", "WINTER", "SPRING"].includes(s)),
          difficulty: (() => {
            const raw = String(beach.difficulty || "INTERMEDIATE").toUpperCase().trim().replace(/\s+/g, '_');
            if (raw.includes("BEGINNER")) return "BEGINNER";
            if (raw.includes("INTERMEDIATE") || raw.includes("ALL_LEVELS") || raw.includes("ALL")) return "INTERMEDIATE";
            if (raw.includes("ADVANCED") || raw.includes("EXPERIENCED")) return "ADVANCED";
            if (raw.includes("EXPERT")) return "EXPERT";
            return "INTERMEDIATE"; // Fallback
          })(),
          waveType: (() => {
            const raw = String(beach.waveType || "BEACH_BREAK").toUpperCase().replace(/\s+/g, '_');
            if (raw.includes("POINT")) return "POINT_BREAK";
            if (raw.includes("REEF") || raw === "SLAB") return "REEF_BREAK";
            if (raw.includes("RIVER")) return "RIVER_MOUTH";
            if (raw.includes("BEACH") || raw === "WEDGE" || raw === "SHOREBREAK") return "BEACH_BREAK";
            return "BEACH_BREAK"; // Fallback
          })(),
          crimeLevel: (beach.crimeLevel || "LOW").toUpperCase(),
          optimalTide: (beach.optimalTide || "UNKNOWN").toUpperCase().replace(/-/g, '_'),
          bestMonthOfYear: beach.bestMonthOfYear?.toUpperCase(),
          sharkAttack: beach.sharkAttack?.hasAttack ? "MODERATE" : "LOW",
          hazards: (beach.hazards || []).map((h: string) => {
            const val = h.toUpperCase();
            if (val.includes("REEF")) return "SHALLOW_REEF";
            if (val.includes("CROWD")) return "CROWDS";
            if (val.includes("CURRENT") || val.includes("RIP")) return "CURRENTS";
            if (val.includes("ROCK")) return "ROCKS";
            if (val.includes("SHARK")) return "SHARKS";
            if (val.includes("JELLY")) return "JELLYFISH";
            if (val.includes("POLLUT")) return "POLLUTION";
            if (val.includes("LOCAL")) return "LOCALISM";
            if (val.includes("TRAFFIC") || val.includes("BOAT")) return "BOAT_TRAFFIC";
            if (val.includes("UNDERTOW")) return "STRONG_UNDERTOW";
            if (val.includes("OBJECT") || val.includes("HIDDEN")) return "SUBMERGED_OBJECTS";
            return "ROCKS"; // Fallback to ROCKS if nothing else matches
          }),
          videos: beach.videos || (beach.video ? [{ url: beach.video, title: "Featured Video" }] : null),
        };

        // Prisma SharkRisk enum map
        // NONE, LOW, MODERATE, HIGH, EXTREME
        
        // Remove fields that are not in the Prisma model or need special handling
        const { shaper, beer, advertisingPrice, conditionProfiles, optimalTide, bestMonthOfYear, rating, video, ...dbBeach } = normalizedBeach;

        // 🏗️ ENSURE PARENTS EXIST
        // -----------------------
        // 1. Ensure Continent
        await prisma.continent.upsert({
          where: { id: dbBeach.continent },
          update: {},
          create: { id: dbBeach.continent, name: dbBeach.continent }
        });

        // 2. Ensure Country
        await prisma.country.upsert({
          where: { id: dbBeach.countryId },
          update: {},
          create: { 
            id: dbBeach.countryId, 
            name: dbBeach.countryId.toUpperCase(), 
            continentId: dbBeach.continent 
          }
        });

        // 3. Ensure Region
        await prisma.region.upsert({
          where: { id: dbBeach.regionId },
          update: {},
          create: { 
            id: dbBeach.regionId, 
            name: dbBeach.regionId.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            countryId: dbBeach.countryId,
            continent: dbBeach.continent
          }
        });

        // 4. Finally Upsert Beach
        await prisma.beach.upsert({
          where: { id: dbBeach.id },
          update: dbBeach,
          create: dbBeach,
        });

        // 5. Upsert Condition Profiles
        if (conditionProfiles) {
          const normalizeTide = (t: string) => {
             const up = String(t).toUpperCase().replace(' ', '_').replace('-', '_');
             if (up.includes('LOW_TO_MID') || up.includes('LOW_MID')) return 'LOW_TO_MID';
             if (up.includes('MID_TO_HIGH') || up.includes('MID_HIGH')) return 'MID_TO_HIGH';
             if (up.includes('ALL')) return 'ALL';
             if (up.includes('LOW')) return 'LOW';
             if (up.includes('MID')) return 'MID';
             if (up.includes('HIGH')) return 'HIGH';
             return 'UNKNOWN';
          };

          const profilePromises = Object.entries(conditionProfiles).map(async ([category, profile]) => {
            const profileData: any = profile;
            await prisma.beachConditionProfile.upsert({
              where: {
                beachId_category: {
                  beachId: dbBeach.id,
                  category: category as any
                }
              },
              update: {
                optimalWindDirections: profileData.optimalWindDirections || [],
                optimalSwellDirections: profileData.optimalSwellDirections || { min: 0, max: 360 },
                optimalTide: normalizeTide(profileData.optimalTide || ""),
                swellSize: profileData.swellSize || { min: 0, max: 10 },
                idealSwellPeriod: profileData.idealSwellPeriod || { min: 0, max: 25 },
              },
              create: {
                beachId: dbBeach.id,
                category: category as any,
                optimalWindDirections: profileData.optimalWindDirections || [],
                optimalSwellDirections: profileData.optimalSwellDirections || { min: 0, max: 360 },
                optimalTide: normalizeTide(profileData.optimalTide || ""),
                swellSize: profileData.swellSize || { min: 0, max: 10 },
                idealSwellPeriod: profileData.idealSwellPeriod || { min: 0, max: 25 },
              }
            });
          });
          await Promise.all(profilePromises);
        }

        process.stdout.write(".");
      } catch (error: any) {
        console.error(`\n❌ Error seeding beach ${beach.name}:`, error.message);
      }
    }
    console.log(`\n✅ Finished ${file}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
