import fetch from 'node-fetch';

async function testOpenMeteo() {
  const lat = -34.2728;
  const lng = 18.8378;
  const dateStr = '2026-04-29';
  
  console.log("Testing Marine API for everything...");
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn`;
  
  try {
    const res = await fetch(marineUrl);
    const data = await res.json();
    console.log("Marine API Hourly keys:", Object.keys(data.hourly || {}));
    if (data.hourly) {
        console.log("Sample values at index 12:");
        console.log("Wave:", data.hourly.wave_height?.[12]);
        console.log("Wind Speed:", data.hourly.wind_speed_10m?.[12]);
    }
  } catch (e) {
    console.error("Marine API failed");
  }
}

testOpenMeteo();
