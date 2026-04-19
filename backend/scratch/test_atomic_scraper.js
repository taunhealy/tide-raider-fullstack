const { scraperA } = require("../src/lib/scrapers/scraperA");

async function test() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  const region = "western-cape";
  console.log("Starting scrape...");
  try {
    const results = await scraperA(url, region);
    console.log(`Scraped ${results.length} forecasts`);
    const summary = results.reduce((acc, f) => {
      const d = f.date.toISOString().split('T')[0];
      acc[d] = (acc[d] || []).concat(f.timeSlot);
      return acc;
    }, {});
    console.log("Summary:", JSON.stringify(summary, null, 2));
  } catch (e) {
    console.error("Scrape failed:", e.message);
  }
}

test();
