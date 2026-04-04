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
          bestSeasons: (beach.bestSeasons || []).flatMap((s: string) => {
            const val = String(s).toUpperCase().replace(/-/g, '_');
            if (val === "ALL" || val === "ALL_YEAR" || val === "YEAR_ROUND") return ["SUMMER", "AUTUMN", "WINTER", "SPRING"];
            if (val === "DRY" || val === "DRY_SEASON") return ["SUMMER", "AUTUMN"];
            if (val === "WET" || val === "WET_SEASON") return ["WINTER", "SPRING"];
            if (val === "FALL") return ["AUTUMN"];
            return [val];
          }).filter((s: string) => ["SUMMER", "AUTUMN", "WINTER", "SPRING"].includes(s)),
          difficulty: (beach.difficulty === "All Levels" ? "INTERMEDIATE" : (beach.difficulty || "INTERMEDIATE")).toUpperCase().trim(),
          waveType: (beach.waveType || "BEACH_BREAK").toUpperCase().replace(/\s+/g, '_'),
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
        };

        // Prisma SharkRisk enum map
        // NONE, LOW, MODERATE, HIGH, EXTREME
        
        // Remove fields that are not in the Prisma model or need special handling
        const { shaper, beer, advertisingPrice, ...dbBeach } = normalizedBeach;

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
