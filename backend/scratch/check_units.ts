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
  
  // Search for the wind speed unit in the HTML or elements
  const unitElements = $("[class*='unit'], [class*='Unit']");
  console.log(`Found ${unitElements.length} elements containing 'unit' in class.`);
  unitElements.each((i, el) => {
    const text = $(el).text().trim();
    if (text) {
      console.log(`  Unit element: class="${$(el).attr("class")}" text="${text}"`);
    }
  });

  // Let's search inside the script tags or the whole HTML text for "3.0" or "6" (if 3 m/s converted to knots)
  // Let's find where 3.09 or similar is in the HTML text
  const bodyText = $("body").text();
  console.log("\nSearching for wind values in body text...");
  
  // Let's see if we can find "kts" or "knots" or "m/s" or "km/h" in the body text
  const units = ["kts", "knots", "m/s", "km/h", "beaufort", "bft"];
  units.forEach(unit => {
    const index = bodyText.toLowerCase().indexOf(unit);
    if (index !== -1) {
      console.log(`Found unit '${unit}' at index ${index}. Context: "${bodyText.substring(index - 50, index + 50).replace(/\n/g, ' ')}"`);
    }
  });
}

main();
