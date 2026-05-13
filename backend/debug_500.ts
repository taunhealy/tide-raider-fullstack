import { ScoreService } from './src/services/scoreService';
import { prisma } from './src/lib/prisma';

async function test() {
  const regionId = 'western-cape';
  const targetDate = new Date('2026-05-13T00:00:00Z');
  const timeSlotParam = 'MORNING';
  const sourceParam = 'WINDFINDER_SUPER';

  console.log('Starting test...');
  
  try {
    const region = await prisma.region.findFirst({
        where: {
            OR: [
                { id: regionId },
                { name: { equals: 'Western Cape', mode: "insensitive" } }
            ]
        }
    });

    if (!region) {
        console.log('Region not found');
        return;
    }

    console.log('Region found:', region.id);

    const forecast = await prisma.forecast.findFirst({
        where: {
            regionId: region.id,
            date: targetDate,
            source: sourceParam as any,
            timeSlot: timeSlotParam as any,
        }
    });

    if (!forecast) {
        console.log('Forecast not found');
        // Let's create a dummy forecast to test the score service
        const dummyForecast = {
            windSpeed: 10,
            windDirection: 180,
            swellHeight: 2.0,
            swellDirection: 220,
            swellPeriod: 12,
            date: targetDate,
            source: sourceParam,
            timeSlot: timeSlotParam
        };
        console.log('Using dummy forecast');
        await ScoreService.calculateAndStoreScores(region.id, dummyForecast as any);
    } else {
        console.log('Forecast found');
        await ScoreService.calculateAndStoreScores(region.id, forecast as any);
    }

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
