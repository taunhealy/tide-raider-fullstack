import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beachId = 'llandudno'; // Verified ID
  
  // First, clean up any existing mock reports for today to avoid unique constraint issues
  const today = new Date();
  today.setUTCHours(0,0,0,0);
  
  await prisma.intelligenceReport.deleteMany({
    where: {
      beachId,
      persona: 'Elite Scout',
      date: today
    }
  });

  const report = await prisma.intelligenceReport.create({
    data: {
      beachId,
      userId: 'cmn4owtab0000s60f0dosfbck', // Using the ID from the metadata
      date: today,
      persona: 'Elite Scout',
      category: 'SURFING',
      duration: 7,
      content: '### TACTICAL ANALYSIS: MUIZENBERG\n\n**OVERVIEW:** A solid groundswell is filling in, making the Corner particularly punchy. Swell 2 is providing some cross-shore texture, but Swell 1 is dominant enough to hold the line.\n\n**WINDOWS:**\n- **Morning:** Best shape as the tide pushes in. High tide at 10:45 AM will be optimal for the loggers.\n- **Afternoon:** Wind picks up from the SE, likely to get crumbly. Head to the back where the sets are cleaner.\n\n**PIONEER ADVICE:** Use a high-volume board to beat the current. Watch for the rip near the rocks.',
    }
  });

  console.log('Mock Report Created:', report);
}

main().catch(console.error).finally(() => prisma.$disconnect());
