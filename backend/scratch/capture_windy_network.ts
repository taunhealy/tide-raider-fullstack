import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Launching browser to capture Windy.com network requests...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"] // Do not disable GPU or software rasterizer so WebGL loads!
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  
  const page = await context.newPage();
  
  const requests: any[] = [];
  
  page.on("request", (req) => {
    const url = req.url();
    const type = req.resourceType();
    if (url.includes("windy.com") && (type === "fetch" || type === "xhr" || url.includes("forecast") || url.includes("detail"))) {
      requests.push({
        url,
        method: req.method(),
        type
      });
      console.log(`Captured [${type}] ${req.method()} -> ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("forecast") && url.includes("windy.com")) {
      try {
        const text = await res.text();
        console.log(`\n🎉 FORECAST RESPONSE FOUND! URL: ${url}`);
        console.log(`Preview: ${text.substring(0, 1000)}`);
        fs.writeFileSync(path.join(__dirname, "captured_forecast.json"), text);
        console.log("Saved captured_forecast.json");
      } catch (e: any) {
        console.log(`Could not read response body for ${url}: ${e.message}`);
      }
    }
  });

  try {
    const url = "https://www.windy.com/-34.359/18.497/ecmwfWaves/waves?waves,-34.506,18.520,10,d:waves";
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    console.log("Navigation complete.");
    
    // Wait a bit more for background API calls
    await new Promise(r => setTimeout(r, 10000));
    
    fs.writeFileSync(path.join(__dirname, "captured_requests.json"), JSON.stringify(requests, null, 2));
    console.log("Saved captured_requests.json");
  } catch (err: any) {
    console.error("Navigation failed:", err.message);
  } finally {
    await browser.close();
  }
}

main();
