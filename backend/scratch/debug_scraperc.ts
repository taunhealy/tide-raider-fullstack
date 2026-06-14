import { scraperC } from "../src/lib/scrapers/scraperC";

async function main() {
  const url = "https://www.windy.com/-34.250/18.650/ecmwfWaves/waves?waves,-34.250,18.650,10";
  const region = "western-cape";
  const forecasts = await scraperC(url, region);
  console.log("Scraped forecasts total:", forecasts.length);
  forecasts.forEach((f, i) => {
    console.log(`${i}: Date=${f.date.toISOString().split('T')[0]} Slot=${f.timeSlot} Hour=${(f as any).rawHour} SwellHeight=${f.swellHeight} SwellPeriod=${f.swellPeriod} WindSpeed=${f.windSpeed}`);
  });
}

main().catch(console.error);
