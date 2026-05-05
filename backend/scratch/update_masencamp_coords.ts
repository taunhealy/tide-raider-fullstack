import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Updating Masencamp coordinates...");

  const beachId = "masencamp-reef";
  const newCoords = { lat: -34.272806, lng: 18.837806 };

  // 1. Update Beach table
  console.log("Updating Beach table...");
  const beach = await prisma.beach.update({
    where: { id: beachId },
    data: {
      coordinates: newCoords
    }
  });

  // 2. Update HiddenGem table
  console.log("Updating HiddenGem table...");
  const gem = await prisma.hiddenGem.update({
    where: { id: beachId },
    data: {
      coordinates: newCoords
    }
  });

  console.log("✅ Masencamp coordinates updated successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
