const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setSpecificForecast() {
  try {
    const yesterday = new Date('2026-04-24');
    const regionId = 'western-cape';
    
    // User provided conditions:
    // Wind speed 2, wind direction 69
    // Swell height 0.8, swell period 9, swell direction 189
    // timeslot - noon , tide 9m
    
    await prisma.forecast.upsert({
      where: {
        date_regionId_source_timeSlot: {
          date: yesterday,
          regionId: regionId,
          source: 'WINDFINDER',
          timeSlot: 'NOON'
        }
      },
      update: {
        windSpeed: 2,
        windDirection: 69,
        swellHeight: 0.8,
        swellPeriod: 9,
        swellDirection: 189,
        tide: '9m'
      },
      create: {
        date: yesterday,
        regionId: regionId,
        source: 'WINDFINDER',
        timeSlot: 'NOON',
        windSpeed: 2,
        windDirection: 69,
        swellHeight: 0.8,
        swellPeriod: 9,
        swellDirection: 189,
        tide: '9m'
      }
    });

    console.log(`✅ Updated WINDFINDER NOON forecast for ${yesterday.toISOString().split('T')[0]} with specific user values.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

setSpecificForecast();
