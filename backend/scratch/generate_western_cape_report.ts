import { IntelligenceService } from '../src/services/intelligenceService';
import { prisma } from '../src/lib/prisma';

async function generateWesternCapeReport() {
  console.log("🔍 Finding a beach in Western Cape and the first user...");
  const beach = await prisma.beach.findFirst({
    where: { regionId: 'western-cape' }
  });
  
  const user = await prisma.user.findFirst();
  
  if (!beach || !user) {
    console.error("❌ Could not locate a Western Cape beach or user records.");
    return;
  }
  
  console.log(`🏖️ Beach: ${beach.name} (${beach.id})`);
  console.log(`👤 User: ${user.name} (${user.id}), Credits: ${user.credits}`);
  
  // Ensure user has ample credits
  if (user.credits < 30) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: 100 }
    });
    console.log("💳 Refilled operator credits to 100.");
  }
  
  const forecastDate = "2026-05-29";
  const sources = ["WINDY", "WINDFINDER_SUPER", "WINDGURU"];
  
  for (const src of sources) {
    console.log(`\n🤖 Pioneer briefing generation: Source=${src}, Days=3, Date=${forecastDate}...`);
    try {
      const result = await IntelligenceService.getTimedReportForBeach(
        beach.id,
        forecastDate,
        user.id,
        3,
        undefined,
        'GENERAL',
        src
      );
      
      console.log(`✅ [${src}] Briefing successfully generated!`);
      console.log(`   ID: ${result.id}`);
      console.log(`   Presenter: ${result.presenterName}`);
      console.log(`   Content: ${result.report.substring(0, 200)}...`);
    } catch (err: any) {
      console.error(`❌ Failed for [${src}]:`, err.message);
      if (err.stack) {
        console.error(err.stack);
      }
    }
  }
  
  console.log("\n✨ All operations complete!");
}

generateWesternCapeReport().catch(console.error).finally(() => prisma.$disconnect());
