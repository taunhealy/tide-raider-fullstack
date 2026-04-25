const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAllSlots() {
  try {
    const yesterday = new Date('2026-04-24');
    const regionId = 'western-cape';
    
    const data = {
      windSpeed: 2,
      windDirection: 69,
      swellHeight: 0.8,
      swellPeriod: 9,
      swellDirection: 189,
      tide: '9m'
    };

    const sources = ['WINDFINDER', 'WINDGURU', 'WINDY'];
    const slots = ['MORNING', 'NOON', 'EVENING'];

    for (const source of sources) {
      for (const slot of slots) {
        await prisma.forecast.upsert({
          where: {
            date_regionId_source_timeSlot: {
              date: yesterday,
              regionId: regionId,
              source: source,
              timeSlot: slot
            }
          },
          update: data,
          create: {
            date: yesterday,
            regionId: regionId,
            source: source,
            timeSlot: slot,
            ...data
          }
        });
      }
    }

    console.log(`✅ Updated ALL sources AND ALL time slots (Morning, Noon, Evening) for yesterday with the correct values.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllSlots();
