import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  console.log(`Fetching URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    
    const html = response.data;
    console.log(`Fetched HTML. Length: ${html.length}`);
    
    // Save a small portion or scan for JSON
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    let match;
    let jsonScripts = [];
    
    const $ = cheerio.load(html);
    
    // Look for JSON-LD or script elements containing JSON data
    $("script").each((i, el) => {
      const type = $(el).attr("type");
      const content = $(el).html() || "";
      if (type === "application/ld+json") {
        jsonScripts.push({ type: "ld+json", content });
      } else if (content.includes("window.forecast") || content.includes("forecast") || content.includes("fcData") || content.includes("data") || content.includes("model")) {
        if (content.length < 5000) {
          jsonScripts.push({ type: "js-variable", preview: content.substring(0, 500) });
        } else {
          jsonScripts.push({ type: "js-variable-large", length: content.length, preview: content.substring(0, 200) });
        }
      }
    });
    
    console.log(`Found ${jsonScripts.length} interesting scripts.`);
    fs.writeFileSync(path.join(__dirname, "scanned_scripts.json"), JSON.stringify(jsonScripts, null, 2));
    console.log("Wrote scanned_scripts.json");
    
    // Also save the entire HTML file to inspect
    fs.writeFileSync(path.join(__dirname, "muizenberg.html"), html);
    console.log("Saved full muizenberg.html");

    // Let's also check if there is an api call or if we can see the forecast table in raw HTML
    const forecastDays = $(".fc-day");
    console.log(`Cheerio found ${forecastDays.length} .fc-day elements in raw HTML`);
    
    const weathertable = $(".weathertable");
    console.log(`Cheerio found ${weathertable.length} .weathertable elements in raw HTML`);

  } catch (err: any) {
    console.error("Fetch failed:", err.message);
  }
}

main();
