import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beachId = 'llandudno';
  const userId = 'cmn4owtab0000s60f0dosfbck'; // Tide Raider
  
  // 1. Create an OLDER report (May 6, 1 Day)
  const oldDate = new Date('2026-05-06T00:00:00Z');
  await prisma.intelligenceReport.upsert({
    where: {
      intel_history_unique: {
        beachId,
        userId,
        date: oldDate,
        persona: 'GURU',
        duration: 1,
        category: 'SURFING'
      }
    },
    update: {},
    create: {
      beachId,
      userId,
      date: oldDate,
      persona: 'GURU',
      category: 'SURFING',
      duration: 1,
      content: '### HISTORICAL SNAPSHOT: MAY 6\n\nConditions were classic Llandudno. Light offshore winds in the morning kept the peaks groomed. The swell was a bit inconsistent but the sets had plenty of push.\n\n**ADVICE:** Mid-tide was the sweet spot.',
    }
  });

  // 2. Create a NEWER report (May 10, 7 Days)
  const futureDate = new Date('2026-05-10T00:00:00Z');
  await prisma.intelligenceReport.upsert({
    where: {
      intel_history_unique: {
        beachId,
        userId,
        date: futureDate,
        persona: 'STRATEGIST',
        duration: 7,
        category: 'SURFING'
      }
    },
    update: {},
    create: {
      beachId,
      userId,
      date: futureDate,
      persona: 'STRATEGIST',
      category: 'SURFING',
      duration: 7,
      content: '### WEEKLY OUTLOOK: MAY 10 - MAY 17\n\n**SITUATION:** A massive cold front is approaching, set to deliver a heavy groundswell by Tuesday. \n\n**TACTICAL WINDOWS:**\n- **Monday:** The calm before the storm. Small but clean.\n- **Wednesday:** Peak energy. Only for the experts. \n\n**GEAR:** Dust off the step-up. You will need the extra rail length for the Wednesday sets.',
    }
  });

  console.log('Mock Reports for Prev/Next created successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
