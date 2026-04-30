
const { EnsembleService } = require('./backend/src/services/ensembleService');
const { TimeSlot } = require('@prisma/client');

async function runTest() {
  const regionId = 'western-cape';
  const date = new Date('2026-05-06T00:00:00.000Z');
  const slot = 'MORNING';
  
  try {
    console.log(`🚀 Running ensemble test for ${regionId} on ${date.toISOString()} (${slot})...`);
    const result = await EnsembleService.updateEnsembleForecast(regionId, date, slot);
    console.log('✅ Test complete. Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    process.exit(0);
  }
}

runTest();
