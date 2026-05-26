import { prisma } from "../src/lib/prisma";

async function checkCoords() {
  try {
    const beaches = await prisma.beach.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        coordinates: true
      }
    });
    console.log("Beaches coordinates in DB:");
    beaches.forEach(b => {
      console.log(`Beach: ${b.name} (${b.id})`);
      console.log("  coordinates type:", typeof b.coordinates);
      console.log("  coordinates value:", JSON.stringify(b.coordinates));
    });
  } catch (err: any) {
    console.error("Error checking coords:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoords();
