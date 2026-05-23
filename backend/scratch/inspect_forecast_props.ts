import * as fs from "fs";
import * as path from "path";

function main() {
  const scratchDir = __dirname;
  
  // Inspect astro_island_20_props.json
  const file20Path = path.join(scratchDir, "astro_island_20_props.json");
  if (fs.existsSync(file20Path)) {
    console.log("=== Structure of astro_island_20_props.json (fcData) ===");
    const data = JSON.parse(fs.readFileSync(file20Path, "utf-8"));
    const fcData = data.fcData;
    console.log("fcData type:", typeof fcData);
    if (fcData && typeof fcData === "object") {
      const keys = Object.keys(fcData);
      console.log("fcData top keys:", keys.slice(0, 15));
      
      // Let's see some specific keys
      if (Array.isArray(fcData.value)) {
        console.log("fcData.value length:", fcData.value.length);
        console.log("fcData.value[0]:", JSON.stringify(fcData.value[0]).substring(0, 500));
      }
    }
  }

  // Inspect astro_island_13_props.json
  const file13Path = path.join(scratchDir, "astro_island_13_props.json");
  if (fs.existsSync(file13Path)) {
    console.log("\n=== Structure of astro_island_13_props.json (fcSectionData) ===");
    const data = JSON.parse(fs.readFileSync(file13Path, "utf-8"));
    const fcSectionData = data.fcSectionData;
    console.log("fcSectionData type:", typeof fcSectionData);
    if (fcSectionData && typeof fcSectionData === "object") {
      const keys = Object.keys(fcSectionData);
      console.log("fcSectionData top keys:", keys);
      
      // Let's print some inner structures
      if (fcSectionData.value) {
        console.log("fcSectionData.value structure keys:", Object.keys(fcSectionData.value));
        const val = fcSectionData.value;
        if (val.days) {
          console.log("val.days type/length:", Array.isArray(val.days) ? `Array (${val.days.length})` : typeof val.days);
          if (Array.isArray(val.days) && val.days.length > 0) {
            console.log("val.days[0] keys:", Object.keys(val.days[0]));
            console.log("val.days[0] preview:", JSON.stringify(val.days[0]).substring(0, 800));
          }
        }
      }
    }
  }
}

main();
