import { getLatestConditions } from '../../../src/services/surfConditionsService';

async function testScraper() {
  const regionId = 'asturias';
  const source = 'WINDFINDER';
  
  console.log(`🚀 Attempting to scrape: regionId=${regionId}, source=${source}`);
  const start = Date.now();
  
  try {
    const forecast = await getLatestConditions(regionId, true, source as any);
    const duration = Date.now() - start;
    console.log(`✅ Scrape success! (took ${duration}ms)`);
    console.log('Forecast:', JSON.stringify(forecast, null, 2));
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error(`❌ Scrape fail after ${duration}ms`);
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

testScraper();
