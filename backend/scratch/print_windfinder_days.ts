import axios from "axios";
import * as cheerio from "cheerio";

function parseAstroProp(val: any): any {
  if (val === null || val === undefined) return val;
  
  if (Array.isArray(val)) {
    if (val.length === 2 && typeof val[0] === "number") {
      const [type, data] = val;
      if (type === 0) return parseAstroProp(data);
      if (type === 1) {
        if (Array.isArray(data)) return data.map(item => parseAstroProp(item));
        return parseAstroProp(data);
      }
      if (type === 3) return new Date(data);
      return parseAstroProp(data);
    }
    return val.map(item => parseAstroProp(item));
  }
  
  if (typeof val === "object") {
    const res: any = {};
    for (const key of Object.keys(val)) {
      res[key] = parseAstroProp(val[key]);
    }
    return res;
  }
  
  return val;
}

async function test() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  console.log("Fetching url:", url);
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      timeout: 15000
    });
    const html = response.data;
    const $ = cheerio.load(html);
    
    const rawDays: any[] = [];
    $("astro-island").each((_, el) => {
      const propsStr = $(el).attr("props");
      if (propsStr) {
        try {
          const parsed = parseAstroProp(JSON.parse(propsStr));
          if (parsed.fcSectionData) {
            const days = parsed.fcSectionData.flat();
            rawDays.push(...days);
          }
          if (parsed.fcData) {
            const days = [parsed.fcData].flat();
            rawDays.push(...days);
          }
        } catch (e) {}
      }
    });

    console.log("Total raw days:", rawDays.length);
    rawDays.forEach((day, index) => {
      console.log(`Day ${index}: dtl = ${day.dtl}`);
      if (day.horizons && Array.isArray(day.horizons)) {
        console.log(`  Horizons count: ${day.horizons.length}`);
        day.horizons.forEach((h: any, hIdx: number) => {
          if (h.fcData && h.fcData.dtl) {
            console.log(`    Horizon ${hIdx}: dtl = ${h.fcData.dtl}`);
          }
        });
      }
    });
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
