const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setOptimalForecast() {
  try {
    const yesterday = new Date('2026-04-24');
    const regionId = 'western-cape';
    
    // Optimal conditions for Glencairn:
    // Wind: NW (315 deg), speed 12 knots
    // Swell: SW (240 deg), height 3.0m, period 14s
    
    const timeSlots = ['MORNING', 'NOON', 'EVENING'];
    const sources = ['WINDFINDER', 'WINDGURU', 'WINDY'];

    for (const source of sources) {
      for (const timeSlot of timeSlots) {
        await prisma.forecast.upsert({
          where: {
            date_regionId_source_timeSlot: {
              date: yesterday,
              regionId: regionId,
              source: source,
              timeSlot: timeSlot
            }
          },
          update: {
            windSpeed: 12,
            windDirection: 315, // NW
            swellHeight: 3.0,
            swellPeriod: 14,
            swellDirection: 240, // SW
          },
          create: {
            date: yesterday,
            regionId: regionId,
            source: source,
            timeSlot: timeSlot,
            windSpeed: 12,
            windDirection: 315,
            swellHeight: 3.0,
            swellPeriod: 14,
            swellDirection: 240,
          }
        });
      }
    }

    console.log(`✅ Updated forecasts for ${yesterday.toISOString().split('T')[0]} (Western Cape) to Glencairn optimal conditions.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

setOptimalForecast();
