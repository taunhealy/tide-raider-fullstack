const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBeachOptimal() {
  try {
    const beach = await prisma.beach.findFirst({
      where: { id: 'glencairn' }
    });

    if (beach) {
      await prisma.beach.update({
        where: { id: 'glencairn' },
        data: {
          optimalWindDirections: ["ENE", "NE"],
          optimalSwellDirections: {
            min: 170,
            max: 210,
            cardinal: "S",
          },
          swellSize: {
            min: 0.5,
            max: 1.5,
          },
          idealSwellPeriod: {
            min: 8,
            max: 12,
          }
        }
      });
      console.log(`✅ Updated Glencairn optimal conditions in DB.`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBeachOptimal();
