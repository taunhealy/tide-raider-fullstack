import fetch from 'node-fetch';

async function check() {
  const url = "http://localhost:4050/api/filtered-beaches?regionId=western-cape&timeSlot=NOON&forecastDate=2026-05-31&ignoreRegion=true";
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Beaches returned: ${data.beaches?.length}`);
    if (data.beaches?.length > 0) {
      console.log(`First beach: ${data.beaches[0].name}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

check().catch(console.error);
