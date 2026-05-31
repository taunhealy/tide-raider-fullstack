import fetch from 'node-fetch';

async function check() {
  const res = await fetch("http://localhost:4050/api/intelligence/history");
  const data = await res.json();
  console.log(`Fetched ${data.length} reports`);
  console.log(data);
}

check().catch(console.error);
