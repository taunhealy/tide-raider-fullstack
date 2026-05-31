import fetch from 'node-fetch';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function test() {
  const res = await fetch('http://localhost:3000/api/backend/filtered-beaches?regionId=western-cape');
  const data = await res.json();
  
  if (!data.beaches) {
    console.log("No beaches returned", data);
    return;
  }
  
  let nullDistanceCount = 0;
  const userLocation = { lat: -33.9249, lng: 18.4241 }; // Cape Town
  
  console.log(`Testing ${data.beaches.length} beaches...`);
  
  for (const b of data.beaches.slice(0, 5)) {
    let coords = b.coordinates;
    if (typeof coords === "string") {
      try {
        coords = JSON.parse(coords);
      } catch {}
    }

    const beachLat = coords && typeof coords === "object" ? parseFloat((coords as any).lat) : NaN;
    const beachLng = coords && typeof coords === "object" ? parseFloat((coords as any).lng) : NaN;
    
    let distance = null;
    if (userLocation && !isNaN(beachLat) && !isNaN(beachLng)) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        beachLat,
        beachLng
      );
    } else {
      nullDistanceCount++;
    }
    
    console.log(`Beach: ${b.name}, lat: ${beachLat}, lng: ${beachLng}, dist: ${distance}`);
  }
  
  console.log(`Total null distances: ${nullDistanceCount}`);
}

test().catch(console.error);
