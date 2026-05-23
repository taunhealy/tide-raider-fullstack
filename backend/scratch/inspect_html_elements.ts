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
  
  // Find all elements with classes containing 'fc' or 'day' or 'forecast' or 'table'
  const classes = new Set<string>();
  $("*").each((i, el) => {
    const classAttr = $(el).attr("class");
    if (classAttr) {
      classAttr.split(/\s+/).forEach(cls => {
        if (cls.includes("day") || cls.includes("fc") || cls.includes("forecast") || cls.includes("weather") || cls.includes("table")) {
          classes.add(cls);
        }
      });
    }
  });
  
  console.log("Interesting classes found in raw HTML:");
  console.log(Array.from(classes).sort());
  
  // Let's print out the content of the single .fc-day element found, or see where the main content is.
  const mainEl = $("main");
  console.log(`Main element present: ${mainEl.length}`);
  if (mainEl.length > 0) {
    console.log(`Main element class: ${mainEl.attr("class")}`);
    console.log(`Main inner HTML length: ${mainEl.html()?.length}`);
  }

  // Let's see if there are elements with a class that starts with "FcTable" or similar
  const fcTables = $('[class*="FcTable"], [class*="fc-table"], [class*="weathertable"]');
  console.log(`Found ${fcTables.length} table-like elements`);
  fcTables.each((i, el) => {
    console.log(`Table #${i}: class="${$(el).attr("class")}" tag="${el.tagName}"`);
  });

  // Let's search if there are elements containing "Monday" or "Tuesday" etc. and print their parents/classes
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  console.log("\nSearching for weekday mentions:");
  $("*").each((i, el) => {
    const text = $(el).text().trim();
    if (daysOfWeek.includes(text)) {
      console.log(`Found "${text}" in element tag="${el.tagName}" class="${$(el).attr("class")}"`);
    }
  });
}

main();
