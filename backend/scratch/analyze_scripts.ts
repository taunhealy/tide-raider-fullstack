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
  
  console.log("Analyzing script tags...");
  $("script").each((idx, el) => {
    const src = $(el).attr("src");
    const type = $(el).attr("type");
    const content = $(el).html() || "";
    
    console.log(`\n--- Script #${idx} ---`);
    console.log(`src: ${src || "inline"}`);
    console.log(`type: ${type || "default"}`);
    console.log(`length: ${content.length}`);
    if (content.length > 0) {
      console.log(`preview: ${content.substring(0, 300)}`);
      if (content.includes("muizenberg") || content.includes("forecast") || content.includes("tide") || content.includes("swell")) {
        console.log(`Matches forecast keywords: true`);
      }
    }
  });
}

main();
