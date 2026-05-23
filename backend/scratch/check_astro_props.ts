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
  
  console.log("Analyzing astro-island tags...");
  $("astro-island").each((idx, el) => {
    console.log(`\n--- Astro Island #${idx} ---`);
    const componentUrl = $(el).attr("component-url");
    const componentExport = $(el).attr("component-export");
    console.log(`component-url: ${componentUrl}`);
    console.log(`component-export: ${componentExport}`);
    
    // List all attributes
    const attribs = el.attribs;
    for (const key of Object.keys(attribs)) {
      if (key !== "component-url" && key !== "component-export") {
        console.log(`Attribute [${key}]: ${attribs[key].substring(0, 300)}`);
      }
    }

    // Let's check if there is a props attribute
    const props = $(el).attr("props");
    if (props) {
      console.log(`Props length: ${props.length}`);
      try {
        const parsedProps = JSON.parse(props);
        console.log(`Successfully parsed props keys:`, Object.keys(parsedProps));
        // Save to a file for closer inspection
        fs.writeFileSync(path.join(__dirname, `astro_island_${idx}_props.json`), JSON.stringify(parsedProps, null, 2));
        console.log(`Wrote astro_island_${idx}_props.json`);
      } catch (err: any) {
        console.error("Failed to parse props as JSON:", err.message);
      }
    }
  });
}

main();
