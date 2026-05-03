import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import process from "process";

const prisma = new PrismaClient();

async function main() {
  const africaPath = path.join(process.cwd(), "src/data/continents/africa.json");
  const data = JSON.parse(fs.readFileSync(africaPath, "utf8"));
  
  const sunsetBeach = data.find((b: any) => b.id === "sunset-beach");
  
  if (!sunsetBeach) {
    console.error("Sunset Beach not found in africa.json");
    return;
  }

  console.log("Upserting Sunset Beach...");

  // Mapping functions
  const mapDifficulty = (v: string) => v as any;
  const mapWaveType = (v: string) => v as any;
  const mapCrimeLevel = (v: string) => (v ? v.toUpperCase() : "LOW") as any;
  const mapSeason = (v: string) => v.toUpperCase() as any;
  const mapHazards = (values: string[]) => {
    const map: Record<string, any> = {
      "Rocks": "ROCKS",
      "Currents": "CURRENTS",
      "Sharks": "SHARKS",
      "Rip currents": "CURRENTS",
      "Shorebreak": "ROCKS", // Fallback
      "Strong wind": "CURRENTS" // Fallback
    };
    return values.map(v => map[v] || "ROCKS");
  };

  const mapSharkRisk = (value: any) => {
    if (!value || typeof value !== "object") return "NONE";
    const risk = value.risk || (value.hasAttack ? "MODERATE" : "NONE");
    return (risk.toUpperCase()) as any;
  };

  await prisma.beach.upsert({
    where: { id: "sunset-beach" },
    update: {
      name: sunsetBeach.name,
      location: sunsetBeach.location,
      description: sunsetBeach.description,
      distanceFromCT: sunsetBeach.distanceFromCT || 0,
      difficulty: mapDifficulty(sunsetBeach.difficulty),
      waveType: mapWaveType(sunsetBeach.waveType),
      waterTemp: sunsetBeach.waterTemp,
      hazards: mapHazards(sunsetBeach.hazards || []),
      crimeLevel: mapCrimeLevel(sunsetBeach.crimeLevel),
      sharkAttack: mapSharkRisk(sunsetBeach.sharkAttack),
      coordinates: sunsetBeach.coordinates,
      conditionProfiles: {
        deleteMany: { category: 'GENERAL' },
        create: {
          category: 'GENERAL',
          optimalWindDirections: sunsetBeach.conditionProfiles.GENERAL.optimalWindDirections,
          optimalSwellDirections: sunsetBeach.conditionProfiles.GENERAL.optimalSwellDirections,
          optimalTide: sunsetBeach.conditionProfiles.GENERAL.optimalTide as any,
          swellSize: sunsetBeach.conditionProfiles.GENERAL.swellSize,
          idealSwellPeriod: sunsetBeach.conditionProfiles.GENERAL.idealSwellPeriod,
        }
      }
    },
    create: {
      id: "sunset-beach",
      name: sunsetBeach.name,
      continent: "Africa",
      countryId: "za",
      regionId: "western-cape",
      location: sunsetBeach.location,
      distanceFromCT: sunsetBeach.distanceFromCT || 0,
      description: sunsetBeach.description,
      difficulty: mapDifficulty(sunsetBeach.difficulty),
      waveType: mapWaveType(sunsetBeach.waveType),
      waterTemp: sunsetBeach.waterTemp,
      hazards: mapHazards(sunsetBeach.hazards || []),
      crimeLevel: mapCrimeLevel(sunsetBeach.crimeLevel),
      sharkAttack: mapSharkRisk(sunsetBeach.sharkAttack),
      coordinates: sunsetBeach.coordinates,
      conditionProfiles: {
        create: {
          category: 'GENERAL',
          optimalWindDirections: sunsetBeach.conditionProfiles.GENERAL.optimalWindDirections,
          optimalSwellDirections: sunsetBeach.conditionProfiles.GENERAL.optimalSwellDirections,
          optimalTide: sunsetBeach.conditionProfiles.GENERAL.optimalTide as any,
          swellSize: sunsetBeach.conditionProfiles.GENERAL.swellSize,
          idealSwellPeriod: sunsetBeach.conditionProfiles.GENERAL.idealSwellPeriod,
        }
      }
    }
  });

  console.log("✅ Sunset Beach upserted successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
