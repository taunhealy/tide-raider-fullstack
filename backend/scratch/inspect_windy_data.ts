import * as fs from "fs";
import * as path from "path";

function main() {
  const filePath = path.join(__dirname, "windy_api_data.json");
  if (!fs.existsSync(filePath)) {
    console.error("windy_api_data.json not found.");
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log("Data keys/length:", Array.isArray(data) ? `Array (${data.length})` : typeof data);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log("First element:", data[0]);
    
    // In our printout above, the keys are actually string indices of a flattened structure
    // Let's check what properties the elements have
    console.log("Types of keys:");
    data.slice(0, 5).forEach((el, idx) => {
      console.log(`Index ${idx}:`, typeof el, el);
    });
  } else if (typeof data === "object") {
    // If it's an object with keys like '0', '1', '2'
    const keys = Object.keys(data);
    console.log("Total keys:", keys.length);
    console.log("Sample keys/values:");
    keys.slice(0, 10).forEach(k => {
      console.log(`  ${k}:`, typeof data[k], data[k]);
    });
    
    // Let's search if there are properties like "header", "data", "forecast", etc.
    const nonNumericKeys = keys.filter(k => isNaN(Number(k)));
    console.log("Non-numeric keys:", nonNumericKeys);
    
    // Wait, let's see if there is a header or metadata in the object
    // Or is the response itself a flat array or dictionary of floats?
    // Let's print out if there is any array in the object.
    for (const key of keys) {
      if (typeof data[key] === "object" && data[key] !== null) {
        console.log(`Key "${key}" is object. Keys:`, Object.keys(data[key]).slice(0, 10));
      }
    }
  }
}

main();
