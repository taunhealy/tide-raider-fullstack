import fetch from 'node-fetch';

async function testOpenMeteo() {
  const lat = -34.1275;
  const lng = 18.4486;
  const dateStr = '2026-05-28';
  
  const urls = [
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn`,
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn`
  ];

  for (const url of urls) {
    console.log(`\nFetching: ${url}`);
    try {
      const res = await fetch(url);
      const data = await res.json() as any;
      console.log("Status:", res.status);
      console.log("Keys:", Object.keys(data));
      if (data.error) {
        console.log("Error details:", data.reason || data.message);
      }
      if (data.hourly) {
        console.log("Hourly data available!");
        console.log("wave_height:", data.hourly.wave_height ? data.hourly.wave_height.slice(8, 18) : "N/A");
        console.log("wind_speed_10m:", data.hourly.wind_speed_10m ? data.hourly.wind_speed_10m.slice(8, 18) : "N/A");
      }
    } catch (e: any) {
      console.error("Failed:", e.message);
    }
  }
}

testOpenMeteo();
