import { scraperA } from "../src/lib/scrapers/scraperA";
import dotenv from "dotenv";

dotenv.config();

async function testUrl(url: string, region: string) {
  console.log(`\n--------------------------------------------`);
  console.log(`Testing: Region [${region}] | URL: [${url}]`);
  console.log(`--------------------------------------------`);
  
  const start = Date.now();
  try {
    const result: any = await scraperA(url, region);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log(`✅ Success in ${duration}s!`);
    console.log(`   Scraped ${result.forecasts.length} forecasts.`);
    console.log(`   isSuperforecast: ${result.isSuperforecast}`);
    console.log(`   First forecast sample:`, {
      date: result.forecasts[0].date.toISOString().split('T')[0],
      timeSlot: result.forecasts[0].timeSlot,
      windSpeed: `${result.forecasts[0].windSpeed} kt`,
      windDirection: `${result.forecasts[0].windDirection}°`,
      swellHeight: `${result.forecasts[0].swellHeight} m`,
      swellPeriod: `${result.forecasts[0].swellPeriod} s`,
      swellDirection: `${result.forecasts[0].swellDirection}°`,
      tide: result.forecasts[0].tide,
      rawHour: `${result.forecasts[0].rawHour}h`
    });
  } catch (e: any) {
    console.error(`❌ Failed:`, e.message);
  }
}

async function main() {
  const tests = [
    // Western Cape
    { url: "https://www.windfinder.com/weatherforecast/muizenberg", region: "western-cape" },
    { url: "https://www.windfinder.com/forecast/muizenberg", region: "western-cape" },
    // Eastern Cape
    { url: "https://www.windfinder.com/weatherforecast/jeffreys_bay", region: "eastern-cape" },
    { url: "https://www.windfinder.com/forecast/jeffreys_bay", region: "eastern-cape" },
    // KwaZulu-Natal (Durban)
    { url: "https://www.windfinder.com/weatherforecast/durban_bluff", region: "kwazulu-natal" },
    { url: "https://www.windfinder.com/forecast/durban_bluff", region: "kwazulu-natal" },
    // Namibia (Swakopmund)
    { url: "https://www.windfinder.com/weatherforecast/swakopmund", region: "swakopmund" },
    { url: "https://www.windfinder.com/forecast/swakopmund", region: "swakopmund" }
  ];

  console.log("🚀 Starting Multi-Region Windfinder Scraper Validation...");
  for (const t of tests) {
    await testUrl(t.url, t.region);
  }
  console.log("\n🎉 All tests completed.");
}

main();
