import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixTrekos() {
  console.log("🚀 Hardening Trekos Conditions...");

  // Fix Trekos
  await prisma.beach.update({
    where: { id: "trekos" },
    data: {
      optimalWindDirections: "E,SE,NE,ESE,SSE,ENE",
      optimalSwellDirections: { min: 190, max: 280 },
      swellSize: { min: 0.7, max: 6.0 },
      idealSwellPeriod: { min: 8, max: 24 }
    }
  });
  console.log("✅ Trekos: Broadened wind shelf and swell window to reflect high-fidelity beach break characteristics.");
}

fixTrekos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
