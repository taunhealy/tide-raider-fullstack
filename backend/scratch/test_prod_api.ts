import fetch from 'node-fetch';

async function check() {
  const url = "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app/api/intelligence/history";
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Reports returned: ${data?.length}`);
    if (data?.length > 0) {
      console.log(`First report: ${data[0].beach?.name} (${data[0].date})`);
      console.log(`Second report: ${data[1]?.beach?.name} (${data[1]?.date})`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

check().catch(console.error);
