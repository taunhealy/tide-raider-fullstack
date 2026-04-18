import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixBeaches() {
  console.log("🚀 Hardening Beach Conditions...");

  // Fix Crayfish Factory
  await prisma.beach.update({
    where: { id: "crayfish-factory" },
    data: {
      optimalWindDirections: "E,SE,NE,SSE,ENE",
      optimalSwellDirections: { min: 190, max: 270 },
      swellSize: { min: 1.8, max: 10.0 }, // Broadened slightly for more action
      idealSwellPeriod: { min: 10, max: 24 }
    }
  });
  console.log("✅ Crayfish Factory: Integrated SW/W swell wrap and expanded easterly wind shelf.");

  // Fix Misty Cliffs
  await prisma.beach.update({
    where: { id: "misty-cliffs" },
    data: {
      optimalWindDirections: "SE,E,NE,ESE,SSE,ENE",
      optimalSwellDirections: { min: 190, max: 280 }, // Broad beach break shelf
      swellSize: { min: 0.8, max: 4.5 },
      idealSwellPeriod: { min: 8, max: 24 }
    }
  });
  console.log("✅ Misty Cliffs: Expanded swell window to SSW-W and included full South-Easterly support.");
}

fixBeaches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
