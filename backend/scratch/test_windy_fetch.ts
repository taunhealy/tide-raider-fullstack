import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const url = "https://www.windy.com/-34.359/18.497/ecmwfWaves/waves?waves,-34.506,18.520,10";
  console.log(`Fetching Windy URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    
    const html = response.data;
    console.log(`Fetched Windy HTML. Length: ${html.length}`);
    fs.writeFileSync(path.join(__dirname, "windy.html"), html);
    console.log("Saved full windy.html");

    const $ = cheerio.load(html);
    
    console.log("Scanning Windy script tags...");
    const scriptInfos: any[] = [];
    $("script").each((idx, el) => {
      const src = $(el).attr("src");
      const content = $(el).html() || "";
      console.log(`Script #${idx}: src="${src || 'inline'}" length=${content.length}`);
      if (content.length > 0) {
        scriptInfos.push({
          idx,
          preview: content.substring(0, 300),
          length: content.length
        });
      }
    });

    fs.writeFileSync(path.join(__dirname, "windy_scripts.json"), JSON.stringify(scriptInfos, null, 2));

  } catch (err: any) {
    console.error("Fetch failed:", err.message);
  }
}

main();
