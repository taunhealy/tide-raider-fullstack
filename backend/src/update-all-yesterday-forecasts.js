const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAllSources() {
  try {
    const yesterday = new Date('2026-04-24');
    const regionId = 'western-cape';
    const timeSlot = 'NOON';
    
    // Values provided by user:
    const data = {
      windSpeed: 2,
      windDirection: 69,
      swellHeight: 0.8,
      swellPeriod: 9,
      swellDirection: 189,
      tide: '9m'
    };

    const sources = ['WINDFINDER', 'WINDGURU', 'WINDY'];

    for (const source of sources) {
      await prisma.forecast.upsert({
        where: {
          date_regionId_source_timeSlot: {
            date: yesterday,
            regionId: regionId,
            source: source,
            timeSlot: timeSlot
          }
        },
        update: data,
        create: {
          date: yesterday,
          regionId: regionId,
          source: source,
          timeSlot: timeSlot,
          ...data
        }
      });
    }

    console.log(`✅ Updated ALL sources (WINDFINDER, WINDGURU, WINDY) for yesterday NOON with the correct values.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllSources();
