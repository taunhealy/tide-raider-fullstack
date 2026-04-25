const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBeachFinal() {
  try {
    // Latest values from the user's edits in beachData.ts
    await prisma.beach.update({
      where: { id: 'glencairn' },
      data: {
        optimalWindDirections: ["ENE", "NE"],
        optimalSwellDirections: {
          min: 170,
          max: 190,
          cardinal: "S",
        },
        optimalTide: "LOW_TO_MID",
        swellSize: {
          min: 0.7,
          max: 1.5,
        },
        idealSwellPeriod: {
          min: 8,
          max: 12,
        },
        hazards: ["RIPTIDES", "SHARKS"],
      }
    });
    console.log(`✅ Finalized Glencairn optimal conditions in DB (LOW_TO_MID, 0.7m min, removed Rocks).`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBeachFinal();
