import axios from "axios";

function base64EncodeUrl(str: string): string {
  return Buffer.from(str).toString("base64").replace(/=+$/, "");
}

async function testCoords(lat: number, lon: number) {
  const today = new Date().toISOString().split("T")[0];
  const refTime = `${today}T00:00:00Z`;
  
  const part1 = "forecast";
  const part2 = "ecmwfWaves";
  const part3 = `point/ecmwfWaves/v2.9/${lat}/${lon}?refTime=${refTime}&source=detail&step=3`;
  
  const encPart1 = base64EncodeUrl(part1);
  const encPart2 = base64EncodeUrl(part2);
  const encPart3 = base64EncodeUrl(part3);
  
  const apiUrl = `https://node.windy.com/${encPart1}/${encPart2}/${encPart3}`;

  try {
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

    let found = 0;
    for (let i = 0; i < data.hour.length; i++) {
      if (data.waves[i] !== null && data.waves[i] !== undefined) {
        found++;
      }
    }
    console.log(`Coords [${lat}, ${lon}]: Found ${found} non-null wave points out of ${data.hour.length}`);
  } catch (err: any) {
    console.error(`Coords [${lat}, ${lon}] Error:`, err.message);
  }
}

async function runTests() {
  // Original coords: -34.359, 18.497
  await testCoords(-34.359, 18.497);
  // Slightly south-west (out in the open ocean off Cape Peninsula): -34.450, 18.350
  await testCoords(-34.450, 18.350);
  // Slightly south-east (out in False Bay): -34.250, 18.650
  await testCoords(-34.250, 18.650);
}

runTests();
