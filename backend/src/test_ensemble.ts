
import { EnsembleService } from "./services/ensembleService";
import { TimeSlot } from "@prisma/client";

async function runTest() {
  const regionId = 'western-cape';
  const date = new Date('2026-05-06T00:00:00.000Z');
  const slot = TimeSlot.MORNING;
  
  try {
    console.log(`🚀 [Test] Running ensemble for ${regionId} on ${date.toISOString()} (${slot})...`);
    const result = await EnsembleService.updateEnsembleForecast(regionId, date, slot);
    console.log('✅ [Test] Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ [Test] Failed:', err);
  } finally {
    process.exit(0);
  }
}

runTest();
