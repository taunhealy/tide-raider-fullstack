import { IntelligenceService } from "../src/services/intelligenceService";
import { prisma } from "../src/lib/prisma";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Starting AI Intelligence Report Test ===");
  
  // 1. Fetch a user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ No users found in database to run the test!");
    return;
  }
  console.log(`👤 Using user: ${user.name} (${user.id}) | Credits: ${user.credits}`);
  
  // Give user some credits if they are low
  if (user.credits < 10) {
    console.log(`💸 Adding credits to user for testing...`);
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: 100 }
    });
  }

  // 2. Fetch a beach
  const beach = await prisma.beach.findFirst();
  if (!beach) {
    console.error("❌ No beaches found in database!");
    return;
  }
  console.log(`🏖️ Using beach: ${beach.name} (${beach.id})`);

  // Ensure there are forecasts in the DB to query
  const today = new Date();
  today.setUTCHours(0,0,0,0);
  console.log(`📅 Targeting date: ${today.toISOString()}`);

  try {
    console.log("🧹 Clearing any existing report for this beach/date to force a fresh generation...");
    await prisma.intelligenceReport.deleteMany({
      where: {
        beachId: beach.id,
        date: today,
      }
    });

    console.log("🧠 Triggering AI report generation...");
    const result = await IntelligenceService.getTimedReportForBeach(
      beach.id,
      today.toISOString(),
      user.id,
      1, // 1 day
      "AUTO",
      "GENERAL"
    );
    
    console.log("\n🎉 AI REPORT GENERATED SUCCESSFULLY!");
    console.log(`Presenter: ${result.presenterName}`);
    console.log(`Credits remaining: ${result.creditsRemaining}`);
    console.log(`Report Content Preview:`);
    console.log(`------------------------------------`);
    console.log(result.report);
    console.log(`------------------------------------`);
  } catch (err: any) {
    console.error("\n❌ AI REPORT GENERATION FAILED!");
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
