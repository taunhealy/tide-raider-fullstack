import * as fs from "fs";
import * as path from "path";

function main() {
  const filePath = path.join(__dirname, "windy_api_data.json");
  if (!fs.existsSync(filePath)) return;
  
  // Read string from the JSON wrapper (it is wrapped in quotes by JSON.stringify)
  const wrappedContent = fs.readFileSync(filePath, "utf-8");
  const base64Content = JSON.parse(wrappedContent);
  
  console.log("Base64 string length:", base64Content.length);
  
  // Decode base64
  const decodedContent = Buffer.from(base64Content, "base64").toString("utf-8");
  console.log("Decoded string length:", decodedContent.length);
  
  const decodedJson = JSON.parse(decodedContent);
  
  // Save the clean decoded JSON
  fs.writeFileSync(path.join(__dirname, "windy_decoded_data.json"), JSON.stringify(decodedJson, null, 2));
  console.log("Wrote windy_decoded_data.json successfully!");
  
  console.log("Decoded JSON Keys:", Object.keys(decodedJson));
  
  // Let's print out what properties it has
  const keys = Object.keys(decodedJson);
  for (const k of keys) {
    const val = decodedJson[k];
    if (Array.isArray(val)) {
      console.log(`  Key [${k}]: Array of length ${val.length}. Sample:`, val.slice(0, 5));
    } else if (typeof val === "object" && val !== null) {
      console.log(`  Key [${k}]: Object. Keys:`, Object.keys(val).slice(0, 10));
    } else {
      console.log(`  Key [${k}]: ${typeof val} = ${val}`);
    }
  }
}

main();
