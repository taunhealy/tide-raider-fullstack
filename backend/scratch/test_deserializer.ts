import * as fs from "fs";
import * as path from "path";

// Helper function to deserialize Astro's prop format
function parseAstroProp(val: any): any {
  if (val === null || val === undefined) return val;
  
  if (Array.isArray(val)) {
    if (val.length === 2 && typeof val[0] === "number") {
      const [type, data] = val;
      if (type === 0) {
        return parseAstroProp(data);
      }
      if (type === 1) {
        if (Array.isArray(data)) {
          return data.map(item => parseAstroProp(item));
        }
        return parseAstroProp(data);
      }
      if (type === 3) {
        return new Date(data);
      }
      // Fallback
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

function main() {
  const scratchDir = __dirname;
  const file13Path = path.join(scratchDir, "astro_island_13_props.json");
  if (!fs.existsSync(file13Path)) {
    console.error("Props file 13 not found.");
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(file13Path, "utf-8"));
  const parsed = parseAstroProp(rawData);
  
  fs.writeFileSync(path.join(scratchDir, "deserialized_props.json"), JSON.stringify(parsed, null, 2));
  console.log("Wrote deserialized_props.json successfully!");

  // Let's inspect the parsed fcSectionData
  const sectionData = parsed.fcSectionData;
  console.log("Parsed fcSectionData type/length:", Array.isArray(sectionData) ? `Array (${sectionData.length})` : typeof sectionData);
  
  if (Array.isArray(sectionData) && sectionData.length > 0) {
    const firstSection = sectionData[0];
    console.log("First section keys:", Object.keys(firstSection));
    
    // In our previous trace, each section has a "days" array
    // Wait, let's see if firstSection has days
    if (firstSection.days) {
      console.log(`First section has ${firstSection.days.length} days.`);
      const firstDay = firstSection.days[0];
      console.log("First day keys:", Object.keys(firstDay));
      console.log("First day dtl:", firstDay.dtl);
      
      if (firstDay.horizons) {
        console.log(`First day has ${firstDay.horizons.length} horizons.`);
        const firstHorizon = firstDay.horizons[0];
        console.log("First horizon keys:", Object.keys(firstHorizon));
        console.log("First horizon fcData:", firstHorizon.fcData);
        console.log("First horizon tideData:", firstHorizon.tideData);
      }
    }
  }
}

main();
