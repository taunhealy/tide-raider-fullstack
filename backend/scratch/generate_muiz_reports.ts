import { IntelligenceService } from '../src/services/intelligenceService';
import { prisma } from '../src/lib/prisma';

async function generateMuizReports() {
  console.log("🔍 Finding Muizenberg beach and first user in database...");
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: 'Muizenberg', mode: 'insensitive' } }
  });
  
  const user = await prisma.user.findFirst();
  
  if (!beach || !user) {
    console.error("❌ Could not locate Muizenberg beach or user records.");
    return;
  }
  
  console.log(`🏖️ Beach: ${beach.name} (${beach.id})`);
  console.log(`👤 User: ${user.name} (${user.id}), Credits: ${user.credits}`);
  
  // Ensure user has ample credits for the three generations
  if (user.credits < 15) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: 30 }
    });
    console.log("💳 Refilled operator credits to 30.");
  }
  
  const todayStr = "2026-05-24";
  const sources = ["WINDY", "WINDFINDER_SUPER", "WINDGURU"];
  
  for (const src of sources) {
    console.log(`\n🤖 Pioneer briefing generation: Source=${src}, Days=3, Date=${todayStr}...`);
    try {
      const result = await IntelligenceService.getTimedReportForBeach(
        beach.id,
        todayStr,
        user.id,
        3,
        undefined,
        'GENERAL',
        src
      );
      
      console.log(`✅ [${src}] Briefing successfully generated!`);
      console.log(`   ID: ${result.id}`);
      console.log(`   Presenter: ${result.presenterName}`);
      console.log(`   Content: ${result.report.substring(0, 150)}...`);
    } catch (err: any) {
      console.error(`❌ Failed for [${src}]:`, err.message);
    }
  }
  
  console.log("\n✨ All operations complete!");
}

generateMuizReports().catch(console.error);
