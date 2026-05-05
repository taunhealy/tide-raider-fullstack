import { PrismaClient, WaveType, Difficulty, OptimalTide, HiddenGemStatus, SportCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Adding Masencamp to Beach and HiddenGem tables...");

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

  const coords = { lat: -34.272639, lng: 18.838389 };
  const beachId = "masencamp-reef";

  // 1. Add to Beach table (for Raid Logs and Map)
  console.log("Adding to Beach table...");
  const beach = await prisma.beach.upsert({
    where: { id: beachId },
    update: {
      name: "Masencamp",
      location: "False Bay / Kogelberg",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      isHiddenGem: true,
      regionId: region.id,
      countryId: country.id,
      continent: "Africa",
      distanceFromCT: 65.0,
      description: "Tactical reef break. High performance wave for advanced riders.",
      bestSeasons: ["SUMMER", "AUTUMN", "SPRING"],
      waterTemp: { "summer": 18, "winter": 14 },
      crimeLevel: "LOW",
      sharkAttack: "LOW"
    },
    create: {
      id: beachId,
      name: "Masencamp",
      location: "False Bay / Kogelberg",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      isHiddenGem: true,
      regionId: region.id,
      countryId: country.id,
      continent: "Africa",
      distanceFromCT: 65.0,
      description: "Tactical reef break. High performance wave for advanced riders.",
      bestSeasons: ["SUMMER", "AUTUMN", "SPRING"],
      waterTemp: { "summer": 18, "winter": 14 },
      crimeLevel: "LOW",
      sharkAttack: "LOW"
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
      optimalSwellDirections: { min: 210, max: 250 }, // SW is ~225. 230 is requested.
      optimalTide: OptimalTide.MID,
      swellSize: { min: 2.3, max: 6.0 },
      idealSwellPeriod: { min: 9, max: 20 }
    },
    create: {
      beachId: beachId,
      category: SportCategory.GENERAL,
      optimalWindDirections: ["SE"],
      optimalSwellDirections: { min: 210, max: 250 },
      optimalTide: OptimalTide.MID,
      swellSize: { min: 2.3, max: 6.0 },
      idealSwellPeriod: { min: 9, max: 20 }
    }
  });

  // 3. Also keep it in HiddenGem for the community feed
  console.log("Updating HiddenGem entry...");
  await prisma.hiddenGem.upsert({
    where: { id: beachId },
    update: {
      name: "Masencamp",
      description: "Tactical reef break. Needs SE wind and strong SW swell (2.3m min). High performance wave for advanced riders.",
      location: "False Bay / Kogelberg area",
      coordinates: coords,
      waveType: WaveType.REEF_BREAK,
      difficulty: Difficulty.ADVANCED,
      optimalWindDirections: ["SE"],
      optimalSwellDirections: { directions: ["SW"], minAngle: 210, maxAngle: 250 },
      swellSize: { min: 2.3, max: 6.0 },
      status: HiddenGemStatus.APPROVED,
      verified: true,
      publishedAt: new Date(),
    },
    create: {
      id: beachId,
      name: "Masencamp",
      description: "Tactical reef break. Needs SE wind and strong SW swell (2.3m min). High performance wave for advanced riders.",
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
      swellSize: { min: 2.3, max: 6.0 },
      submittedById: user.id,
      status: HiddenGemStatus.APPROVED,
      verified: true,
      publishedAt: new Date(),
    }
  });

  console.log("✅ Masencamp fully synchronized across all tables.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
