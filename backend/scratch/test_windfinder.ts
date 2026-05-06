import { scraperA } from '../src/lib/scrapers/scraperA';

async function main() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  const region = "western-cape";
  console.log(`Testing scraperA for ${url}...`);

  try {
    const results = await scraperA(url, region);
    console.log(`Success! Found ${results.length} forecasts.`);
    console.log('Sample data (first 3):', JSON.stringify(results.slice(0, 3), null, 2));
    
    const dates = [...new Set(results.map(f => f.date.toISOString().split('T')[0]))];
    console.log('Dates found:', dates);
  } catch (err) {
    console.error('Scraper failed:', err);
  }
}

main();
