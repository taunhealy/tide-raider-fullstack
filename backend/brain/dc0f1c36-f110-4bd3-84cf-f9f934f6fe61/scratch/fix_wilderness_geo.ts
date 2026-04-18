import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating Wilderness coordinates...");
  try {
    const beach = await prisma.beach.update({
      where: { id: "wilderness" },
      data: {
        coordinates: {
          lat: -33.9912,
          lng: 22.5807
        }
      }
    });
    console.log("✅ Successfully updated Wilderness:", beach.name, beach.coordinates);

    console.log("Updating Platboom coordinates...");
    const platboom = await prisma.beach.update({
      where: { id: "platboom" },
      data: {
        coordinates: {
          lat: -34.3312,
          lng: 18.4633
        }
      }
    });
    console.log("✅ Successfully updated Platboom:", platboom.name, platboom.coordinates);
  } catch (error) {
    console.error("❌ Error during updates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
