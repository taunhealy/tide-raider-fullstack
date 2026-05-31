import { IntelligenceService } from "../src/services/intelligenceService";

async function run() {
  try {
    const report = await IntelligenceService.getTimedReportForBeach(
      "cmnhjq3n1000ts60f2yqer6t9", // Muizenberg ID, or whatever
      "2026-05-31",
      "cmnhjq35d000cs60fxss02p4o", // A user ID
      7,
      "BRO",
      "GENERAL",
      "WINDFINDER"
    );
    console.log(report);
  } catch (e) {
    console.error(e);
  }
}
run();
