import { IntelligenceService } from '../src/services/intelligenceService';
import { prisma } from '../src/lib/prisma';

async function test() {
  console.log("Testing generation with outer-kom...");
  try {
    // Create a mock user or just use system user
    const report = await IntelligenceService.getTimedReportForBeach("outer-kom", new Date().toISOString().split("T")[0], "cmnhjq35d000cs60fxss02p4o", 7, "SURFING", "WINDFINDER");
    console.log("Success! Report generated length:", report.report.length);
  } catch (error: any) {
    console.error("Failed:", error.message);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
