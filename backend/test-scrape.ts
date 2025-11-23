
import puppeteerCore from "puppeteer-core";

async function scrape() {
  const url = "https://www.windfinder.com/forecast/jeffreys_bay";
  console.log("Scraping URL:", url);

  const browser = await puppeteerCore.launch({
    headless: true,
    args: ["--no-sandbox"],
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    channel: "chrome",
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".weathertable", { timeout: 15000 });
    console.log("✅ Found weather table");

    const forecastDaysData = await page.evaluate(() => {
      const doc = document as any;
      const forecastDays = Array.from(doc.querySelectorAll(".forecast-day"));
      console.log(`Found ${forecastDays.length} forecast-day containers`);

      return forecastDays.map((dayElement: any) => {
        const header = dayElement.querySelector(".weathertable__header");
        const headline = header?.querySelector(".weathertable__headline");
        const dateText = headline?.textContent?.trim() || "";

        const rows = Array.from(
          dayElement.querySelectorAll(".weathertable__row")
        ).map((row: any) => ({
          time: row.querySelector(".data-time .value")?.textContent,
          windSpeed: row.querySelector(".cell-wind-3 .units-ws")?.textContent,
        }));

        return { dateText, rows };
      });
    });

    console.log("Forecast Data:", JSON.stringify(forecastDaysData, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}

scrape();
