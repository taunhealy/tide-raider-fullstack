import fetch from 'node-fetch';

async function check() {
  const url = "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app/api/intelligence/history";
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(`Response:`, text);
  } catch (error) {
    console.error("Error:", error);
  }
}

check().catch(console.error);
