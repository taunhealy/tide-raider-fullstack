import { scraperA } from "../src/lib/scrapers/scraperA";

async function test() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  console.log(`Testing scraper for ${url}...`);
  try {
    const results = await scraperA(url, "western-cape");
    console.log("Results:");
    results.forEach(f => {
      console.log(`${f.date.toISOString().split('T')[0]}: Wind ${f.windDirection}°, Swell ${f.swellDirection}°`);
    });
  } catch (e) {
    console.error(e);
  }
}

test();
