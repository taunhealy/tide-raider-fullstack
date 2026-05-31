import fetch from 'node-fetch';

async function check() {
  const res = await fetch("http://localhost:4050/api/filtered-beaches?regionId=western-cape");
  const data = await res.json();
  const beaches = data.beaches || [];
  if (beaches.length > 0) {
    console.log(`First beach: ${beaches[0].name}`);
    console.log(`Coordinates:`, beaches[0].coordinates);
    console.log(`Type:`, typeof beaches[0].coordinates);
  } else {
    console.log("No beaches found");
  }
}

check().catch(console.error);
