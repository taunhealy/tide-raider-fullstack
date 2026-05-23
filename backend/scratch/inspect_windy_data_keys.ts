import * as fs from "fs";
import * as path from "path";

function main() {
  const filePath = path.join(__dirname, "windy_decoded_data.json");
  if (!fs.existsSync(filePath)) return;
  const decoded = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  const data = decoded.data;
  console.log("data keys count:", Object.keys(data).length);
  console.log("data keys list:", Object.keys(data));
  
  // Let's print the length of each array under data keys and a small sample
  for (const k of Object.keys(data)) {
    const val = data[k];
    if (Array.isArray(val)) {
      console.log(`  [${k}]: length=${val.length} | sample (first 5):`, val.slice(0, 5));
    }
  }
}

main();
