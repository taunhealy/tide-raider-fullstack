import axios from "axios";
import * as fs from "fs";
import * as path from "path";

function base64EncodeUrl(str: string): string {
  // Convert string to base64 and remove padding characters (=)
  return Buffer.from(str).toString("base64").replace(/=+$/, "");
}

async function main() {
  const lat = -34.359;
  const lon = 18.497;
  
  // Format today's date in YYYY-MM-DDT00:00:00Z format
  const today = new Date().toISOString().split("T")[0];
  const refTime = `${today}T00:00:00Z`;
  
  // Construct the unencoded path parts
  const part1 = "forecast";
  const part2 = "ecmwfWaves";
  const part3 = `point/ecmwfWaves/v2.9/${lat}/${lon}?refTime=${refTime}&source=detail&step=3`;
  
  const encPart1 = base64EncodeUrl(part1);
  const encPart2 = base64EncodeUrl(part2);
  const encPart3 = base64EncodeUrl(part3);
  
  const apiUrl = `https://node.windy.com/${encPart1}/${encPart2}/${encPart3}`;
  
  console.log(`Unencoded parameters:`);
  console.log(`  Part 1: ${part1}`);
  console.log(`  Part 2: ${part2}`);
  console.log(`  Part 3: ${part3}`);
  console.log(`Encrypted API URL: ${apiUrl}`);
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.windy.com",
        "Referer": "https://www.windy.com/"
      }
    });
    
    console.log("\n🎉 SUCCESS! Received response status:", response.status);
    const data = response.data;
    console.log("Data keys:", Object.keys(data));
    
    // Write data to inspect its keys
    fs.writeFileSync(path.join(__dirname, "windy_api_data.json"), JSON.stringify(data, null, 2));
    console.log("Wrote windy_api_data.json");
    
  } catch (err: any) {
    console.error("API Fetch failed:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
  }
}

main();
