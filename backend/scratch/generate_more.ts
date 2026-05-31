import { IntelligenceService } from '../src/services/intelligenceService';
import { prisma } from '../src/lib/prisma';

async function generateMore() {
  console.log("Generating for Muizenberg Beach...");
  try {
    await IntelligenceService.getTimedReportForBeach("muizenberg-beach", new Date().toISOString().split("T")[0], "cmnhjq35d000cs60fxss02p4o", 7, "SURFING", "SURFING", "WINDFINDER");
    console.log("Muizenberg Success!");
  } catch (e: any) { console.error("Muiz failed:", e.message); }

  console.log("Generating for Llandudno...");
  try {
    await IntelligenceService.getTimedReportForBeach("llandudno", new Date().toISOString().split("T")[0], "cmnhjq35d000cs60fxss02p4o", 7, "BRO", "SURFING", "WINDY");
    console.log("Llandudno Success!");
  } catch (e: any) { console.error("Llandudno failed:", e.message); }
}

generateMore().catch(console.error).finally(() => prisma.$disconnect());
