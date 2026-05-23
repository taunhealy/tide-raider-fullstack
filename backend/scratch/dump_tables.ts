import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

function main() {
  const htmlPath = path.join(__dirname, "muizenberg.html");
  if (!fs.existsSync(htmlPath)) {
    console.error("HTML file not found.");
    return;
  }
  const html = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(html);
  
  // Let's find each fc-day or day container and see its structure.
  console.log("Analyzing .fc-day elements...");
  $(".fc-day, [class*='fc-day']").each((i, el) => {
    console.log(`\n--- Day Container #${i} ---`);
    console.log(`Class: ${$(el).attr("class")}`);
    console.log(`Tag: ${el.tagName}`);
    
    // Header information
    const header = $(el).find(".fc-day-header, [class*='header'], h3, h4");
    console.log(`Header text: "${header.text().trim()}"`);
    
    // How many fc-table-horizon are inside this day?
    const tables = $(el).find(".fc-table-horizon, [class*='fc-table-horizon']");
    console.log(`Tables inside day: ${tables.length}`);
    tables.each((j, tbl) => {
      console.log(`  Table #${j} class: "${$(tbl).attr("class")}"`);
      // Let's print some inner text or row values
      const timeCells = $(tbl).find(".forecast-hour, [class*='time'], [class*='hour']");
      const speedCells = $(tbl).find(".cell-ws, [class*='speed']");
      console.log(`    Time cells count: ${timeCells.length}, Speed cells count: ${speedCells.length}`);
      if (timeCells.length > 0) {
        console.log(`    Time cells preview: ${timeCells.map((_, c) => $(c).text().trim()).get().join(", ")}`);
      }
    });
  });

  console.log("\nAnalyzing any independent .fc-table-horizon elements...");
  $(".fc-table-horizon").each((i, el) => {
    // Let's see who is parent of this table
    const parents = $(el).parents().map((_, p) => p.tagName + (p.attribs.class ? "." + p.attribs.class.split(" ").join(".") : "")).get().reverse().join(" > ");
    console.log(`Table #${i} parent chain: ${parents}`);
  });
}

main();
