import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

function main() {
  const scratchDir = __dirname;
  
  // Read deserialized props
  const propsPath = path.join(scratchDir, "deserialized_props.json");
  if (!fs.existsSync(propsPath)) return;
  const props = JSON.parse(fs.readFileSync(propsPath, "utf-8"));
  
  const fcSectionData = props.fcSectionData;
  if (!Array.isArray(fcSectionData)) return;
  
  const firstDay = fcSectionData[0][0]; // First day array, first day
  console.log("Date:", firstDay.dtl);
  
  // Print first few horizons
  firstDay.horizons.slice(0, 5).forEach((h: any, idx: number) => {
    console.log(`\nHorizon #${idx} (dtl: ${h.fcData.dtl}):`);
    console.log(`  ws (wind speed): ${h.fcData.ws}`);
    console.log(`  wg (wind gust): ${h.fcData.wg}`);
    console.log(`  wah (wave height): ${h.fcData.wah}`);
    console.log(`  wap (wave period): ${h.fcData.wap}`);
    console.log(`  wad (wave direction): ${h.fcData.wad}`);
    if (h.tideData) {
      console.log(`  tide height (th): ${h.tideData.th}`);
      console.log(`  tide phase (tp): ${h.tideData.tp}`);
    }
  });

  // Let's search in muizenberg.html using Cheerio to print some actual text around the table to see the display values
  const htmlPath = path.join(scratchDir, "muizenberg.html");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(html);
  
  console.log("\n=== Table rows text in muizenberg.html ===");
  $(".fc-table-horizon").first().find("*").each((i, el) => {
    const text = $(el).text().trim();
    const cls = $(el).attr("class");
    if (cls && text && text.length < 30) {
      console.log(`Class: ${cls} | Text: "${text}"`);
    }
  });
}

main();
