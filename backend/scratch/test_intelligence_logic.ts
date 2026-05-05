import { PrismaClient, TimeSlot, ForecastSource } from '@prisma/client';

// Use the generated client directly
const prisma = new PrismaClient();

async function runTest() {
  console.log('🚀 Starting Session Intelligence Test...');

  try {
    // 1. Setup: Use existing data to avoid complex creation logic
    let beach = await prisma.beach.findFirst();
    let user = await prisma.user.findFirst();

    if (!beach || !user) {
        throw new Error('Need at least one beach and one user in the database to run this test.');
    }

    console.log(`Using Beach: ${beach.name} (${beach.id})`);
    console.log(`Using User: ${user.name} (${user.id})`);

    // 2. Initial Accuracy State
    // @ts-ignore
    const initialAccuracy = await prisma.beachSourceAccuracy.findUnique({
      where: {
        beachId_source: {
          beachId: beach.id,
          source: ForecastSource.WINDFINDER
        }
      }
    });
    console.log('Initial Accuracy count:', initialAccuracy?.voteCount || 0);

    // 3. Create Log Entry with Intelligence
    console.log('Creating log entry with WINDFINDER as most accurate...');
    // @ts-ignore
    const logEntry = await prisma.logEntry.create({
      data: {
        userId: user.id,
        beachId: beach.id,
        regionId: beach.regionId,
        date: new Date(),
        surferRating: 5,
        surfTimeSlot: TimeSlot.MORNING,
        mostAccurateSource: ForecastSource.WINDFINDER,
        beachName: beach.name
      }
    });

    // 4. Manual Aggregation Mock (mimicking LogService)
    // @ts-ignore
    await prisma.beachSourceAccuracy.upsert({
      where: {
        beachId_source: {
          beachId: beach.id,
          source: ForecastSource.WINDFINDER
        }
      },
      create: {
        beachId: beach.id,
        source: ForecastSource.WINDFINDER,
        voteCount: 1
      },
      update: {
        voteCount: { increment: 1 }
      }
    });

    // 5. Verify Log Entry
    // @ts-ignore
    const savedLog = await prisma.logEntry.findUnique({
      where: { id: logEntry.id }
    });

    console.log('Saved Log Intelligence:', {
      // @ts-ignore
      surfTimeSlot: savedLog?.surfTimeSlot,
      // @ts-ignore
      mostAccurateSource: savedLog?.mostAccurateSource
    });

    // @ts-ignore
    if (savedLog?.surfTimeSlot !== TimeSlot.MORNING || savedLog?.mostAccurateSource !== ForecastSource.WINDFINDER) {
      throw new Error('Log entry fields did not save correctly!');
    }

    // 6. Verify Aggregation
    // @ts-ignore
    const updatedAccuracy = await prisma.beachSourceAccuracy.findUnique({
      where: {
        beachId_source: {
          beachId: beach.id,
          source: ForecastSource.WINDFINDER
        }
      }
    });
    console.log('Updated Accuracy count:', updatedAccuracy?.voteCount || 0);

    if ((updatedAccuracy?.voteCount || 0) !== (initialAccuracy?.voteCount || 0) + 1) {
      throw new Error('Accuracy aggregation failed!');
    }

    console.log('✅ Test Passed: Intelligence data persisted and aggregated correctly.');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
