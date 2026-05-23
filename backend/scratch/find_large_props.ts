import * as fs from "fs";
import * as path from "path";

function main() {
  const scratchDir = __dirname;
  const files = fs.readdirSync(scratchDir).filter(f => f.startsWith("astro_island_") && f.endsWith("_props.json"));
  console.log(`Found ${files.length} props files in scratch.`);
  
  // Sort them by size descending to find the ones containing the most data
  const fileInfos = files.map(f => {
    const filePath = path.join(scratchDir, f);
    const stats = fs.statSync(filePath);
    return { name: f, size: stats.size };
  }).sort((a, b) => b.size - a.size);

  console.log("\nTop 5 largest props files:");
  fileInfos.slice(0, 5).forEach(f => {
    console.log(`${f.name}: ${f.size} bytes`);
    
    // Read a preview of the keys or structure
    try {
      const content = JSON.parse(fs.readFileSync(path.join(scratchDir, f.name), "utf-8"));
      console.log(`  Keys: ${Object.keys(content).join(", ")}`);
      if (content.days) {
        console.log(`  Has "days": true (${content.days.length || Object.keys(content.days).length} items)`);
      }
      if (content.forecastDays) {
        console.log(`  Has "forecastDays": true`);
      }
    } catch (e: any) {
      console.log(`  Error parsing: ${e.message}`);
    }
  });
}

main();
