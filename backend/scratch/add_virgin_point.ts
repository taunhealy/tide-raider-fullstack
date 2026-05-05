import { PrismaClient, WaveType, Difficulty, OptimalTide, HiddenGemStatus, SportCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Adding Virgin Point to Beach and HiddenGem tables...");

  const user = await prisma.user.findFirst({
    where: { email: { in: ["taunhealy@gmail.com", "admin@tideraider.com"] } }
  });

  if (!user) {
    throw new Error("Could not find a valid user to submit the hidden gem.");
  }

  const country = await prisma.country.findFirst({ where: { name: "South Africa" } });
  const region = await prisma.region.findFirst({ where: { name: "Western Cape" } });

  if (!country || !region) {
    throw new Error(`Country or Region not found: country=${!!country}, region=${!!region}`);
  }

  const coords = { lat: -34.185222, lng: 18.819167 };
  const beachId = "virgin-point";

  // 1. Add to Beach table
  console.log("Adding to Beach table...");
  const beach = await prisma.beach.upsert({
    where: { id: beachId },
    update: {
      name: "Virgin Point",
      location: "False Bay / Kogelberg",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      isHiddenGem: true,
      regionId: region.id,
      countryId: country.id,
      continent: "Africa",
      distanceFromCT: 75.0,
      description: "Heavy winter reef break. Requires large SW swell and SE wind.",
      bestSeasons: ["WINTER"],
      waterTemp: { "summer": 17, "winter": 13 },
      crimeLevel: "LOW",
      sharkAttack: "MODERATE"
    },
    create: {
      id: beachId,
      name: "Virgin Point",
      location: "False Bay / Kogelberg",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      isHiddenGem: true,
      regionId: region.id,
      countryId: country.id,
      continent: "Africa",
      distanceFromCT: 75.0,
      description: "Heavy winter reef break. Requires large SW swell and SE wind.",
      bestSeasons: ["WINTER"],
      waterTemp: { "summer": 17, "winter": 13 },
      crimeLevel: "LOW",
      sharkAttack: "MODERATE"
    }
  });

  // 2. Add Condition Profile
  console.log("Adding Condition Profile...");
  await prisma.beachConditionProfile.upsert({
    where: { 
      beachId_category: {
        beachId: beachId,
        category: SportCategory.GENERAL
      }
    },
    update: {
      optimalWindDirections: ["SE"],
      optimalSwellDirections: { min: 210, max: 250 },
      optimalTide: OptimalTide.MID,
      swellSize: { min: 2.5, max: 8.0 },
      idealSwellPeriod: { min: 10, max: 22 }
    },
    create: {
      beachId: beachId,
      category: SportCategory.GENERAL,
      optimalWindDirections: ["SE"],
      optimalSwellDirections: { min: 210, max: 250 },
      optimalTide: OptimalTide.MID,
      swellSize: { min: 2.5, max: 8.0 },
      idealSwellPeriod: { min: 10, max: 22 }
    }
  });

  // 3. Update HiddenGem entry
  console.log("Updating HiddenGem entry...");
  await prisma.hiddenGem.upsert({
    where: { id: beachId },
    update: {
      name: "Virgin Point",
      description: "Heavy winter reef break. Needs SE wind and large SW swell. High performance wave for advanced riders.",
      location: "False Bay / Kogelberg area",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      optimalWindDirections: ["SE"],
      optimalSwellDirections: { directions: ["SW"], minAngle: 210, maxAngle: 250 },
      swellSize: { min: 2.5, max: 8.0 },
      status: HiddenGemStatus.APPROVED,
      verified: true,
      publishedAt: new Date(),
    },
    create: {
      id: beachId,
      name: "Virgin Point",
      description: "Heavy winter reef break. Needs SE wind and large SW swell. High performance wave for advanced riders.",
      location: "False Bay / Kogelberg area",
      regionId: region.id,
      countryId: country.id,
      continent: "Africa",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      optimalTide: OptimalTide.MID,
      optimalWindDirections: ["SE"],
      optimalSwellDirections: { directions: ["SW"], minAngle: 210, maxAngle: 250 },
      swellSize: { min: 2.5, max: 8.0 },
      submittedById: user.id,
      status: HiddenGemStatus.APPROVED,
      verified: true,
      publishedAt: new Date(),
    }
  });

  console.log("✅ Virgin Point fully synchronized across all tables.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
