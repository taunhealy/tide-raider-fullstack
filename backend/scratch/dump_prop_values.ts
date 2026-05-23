import * as fs from "fs";
import * as path from "path";

// Helper function to deserialize Astro's prop format if it uses a custom format,
// or just recursively print what keys and types are in it.
function dumpObject(obj: any, depth = 0, maxDepth = 4): any {
  if (depth > maxDepth) return "...";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    if (obj.length === 2 && typeof obj[0] === "number" && (typeof obj[1] !== "object" || obj[1] === null)) {
      // It's likely a simple serialized leaf node in Astro format like [0, "val"] or [0, true]
      return `[${obj[0]}, ${JSON.stringify(obj[1])}]`;
    }
    return obj.slice(0, 3).map(item => dumpObject(item, depth + 1, maxDepth));
  }

  const result: any = {};
  const keys = Object.keys(obj);
  for (const key of keys.slice(0, 10)) {
    result[key] = dumpObject(obj[key], depth + 1, maxDepth);
  }
  if (keys.length > 10) {
    result["_more_keys_count"] = keys.length - 10;
  }
  return result;
}

function main() {
  const scratchDir = __dirname;
  
  const file13Path = path.join(scratchDir, "astro_island_13_props.json");
  if (fs.existsSync(file13Path)) {
    const rawData = JSON.parse(fs.readFileSync(file13Path, "utf-8"));
    console.log("=== DESERIALIZING astro_island_13_props.json ===");
    console.log(JSON.stringify(dumpObject(rawData, 0, 5), null, 2));
    
    // Let's write a file with a cleaner representation of the keys
    // In Astro's serialization, they sometimes use [0, value] or reference objects by index.
    // Let's print out what the value looks like.
    if (rawData.fcSectionData) {
      console.log("\nfcSectionData:", JSON.stringify(rawData.fcSectionData).substring(0, 1000));
    }
  }
}

main();
