import axios from "axios";

function base64EncodeUrl(str: string): string {
  return Buffer.from(str).toString("base64").replace(/=+$/, "");
}

async function checkWindyFuture() {
  const url = "https://www.windy.com/-34.359/18.497/ecmwfWaves/waves?waves,-34.506,18.520,10";
  const coordMatch = url.match(/\/(\-?\d+\.\d+)\/(\-?\d+\.\d+)/);
  if (!coordMatch) return;
  const lat = parseFloat(coordMatch[1]);
  const lon = parseFloat(coordMatch[2]);
  
  const today = new Date().toISOString().split("T")[0];
  const refTime = `${today}T00:00:00Z`;
  
  const part1 = "forecast";
  const part2 = "ecmwfWaves";
  const part3 = `point/ecmwfWaves/v2.9/${lat}/${lon}?refTime=${refTime}&source=detail&step=3`;
  
  const encPart1 = base64EncodeUrl(part1);
  const encPart2 = base64EncodeUrl(part2);
  const encPart3 = base64EncodeUrl(part3);
  
  const apiUrl = `https://node.windy.com/${encPart1}/${encPart2}/${encPart3}`;

  const response = await axios.get(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://www.windy.com",
      "Referer": "https://www.windy.com/"
    }
  });

  const base64Data = response.data;
  const decodedStr = Buffer.from(base64Data, "base64").toString("utf-8");
  const payload = JSON.parse(decodedStr);
  const data = payload.data;

  // Let's find where data is not null
  console.log("Searching for non-null wave data...");
  let found = 0;
  for (let i = 0; i < data.hour.length; i++) {
    if (data.waves[i] !== null && data.waves[i] !== undefined) {
      console.log(`Index ${i} (${data.day[i]} Hour ${data.hour[i]}):`);
      console.log(`  - waves:`, data.waves[i]);
      console.log(`  - swell:`, data.swell[i]);
      console.log(`  - swellPeriod:`, data.swellPeriod[i]);
      console.log(`  - swellDir:`, data.swellDir[i]);
      found++;
      if (found >= 5) break;
    }
  }
  if (found === 0) {
    console.log("❌ All wave/swell data in response is null!");
  }
}

checkWindyFuture().catch(console.error);
