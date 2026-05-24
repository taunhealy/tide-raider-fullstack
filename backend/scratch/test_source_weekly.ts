import { IntelligenceService } from '../src/services/intelligenceService';
import { prisma } from '../src/lib/prisma';

async function testSourceWeekly() {
  console.log("🔍 Fetching beach and user from DB for testing...");
  const beach = await prisma.beach.findFirst({
    where: { regionId: 'western-cape' }
  }) || await prisma.beach.findFirst();
  
  const user = await prisma.user.findFirst();
  
  if (!beach || !user) {
    console.error("❌ Could not find beach or user in DB.");
    return;
  }
  
  console.log(`🏖️ Selected Beach: ${beach.name} (${beach.id})`);
  console.log(`👤 Operator: ${user.name} (${user.id}), Credits: ${user.credits}`);
  
  // Ensure user has enough credits
  if (user.credits < 4) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: 20 }
    });
    console.log("💳 Refunded testing account to 20 credits.");
  }
  
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const sourceToTest = "WINDGURU";
    console.log(`🚀 Triggering source-specific AI Weekly Briefing generation for [${sourceToTest}]...`);
    
    const result = await IntelligenceService.getTimedReportForBeach(
      beach.id,
      todayStr,
      user.id,
      7,
      undefined,
      'GENERAL',
      sourceToTest
    );
    
    console.log("✅ Signal Received successfully!");
    console.log("Briefing ID:", result.id);
    console.log("Presenter Name:", result.presenterName);
    console.log("Credits Remaining:", result.creditsRemaining);
    console.log("\n--- Briefing Content ---\n");
    console.log(result.report.substring(0, 500) + "...\n");
    
    // Verify database record
    if (result.id) {
      const dbRecord = await prisma.intelligenceReport.findUnique({
        where: { id: result.id }
      });
      console.log("📂 Verified Database Record exists:");
      console.log(`  Source: ${dbRecord?.source}`);
      console.log(`  Category: ${dbRecord?.category}`);
      console.log(`  Beach ID: ${dbRecord?.beachId}`);
      console.log(`  Date: ${dbRecord?.date}`);
    }
  } catch (err: any) {
    console.error("❌ Test failed with error:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

testSourceWeekly().catch(console.error);
