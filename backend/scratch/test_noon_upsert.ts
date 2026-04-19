import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

async function main() {
  const prisma = new PrismaClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log('--- Manual NOON Upsert Test ---');
  try {
    const result = await prisma.forecast.upsert({
      where: {
        date_regionId_source_timeSlot: {
          date: today,
          regionId: 'western-cape',
          source: 'WINDFINDER',
          timeSlot: 'NOON',
        },
      },
      update: {
        windSpeed: 99, // Distinctive value
      },
      create: {
        id: randomUUID(),
        date: today,
        regionId: 'western-cape',
        source: 'WINDFINDER',
        timeSlot: 'NOON',
        windSpeed: 99,
        windDirection: 0,
        swellHeight: 0,
        swellPeriod: 0,
        swellDirection: 0,
      },
    });
    console.log('Upsert Success:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Upsert Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
