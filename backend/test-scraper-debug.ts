
process.env.NODE_ENV = 'development';
import { scraperA } from './src/lib/scrapers/scraperA';

async function test() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  try {
    const data = await scraperA(url, "western-cape");
    console.log("Scraped Data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Scrape failed:", error);
  }
}

test();
