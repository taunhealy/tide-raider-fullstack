import fs from 'fs';
import path from 'path';

const africaPath = 'k:/Kea/tide-raider-fullstack/next/app/data/continents/africa.json';
let data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

const updates = {
  "donkin-bay": { lat: -31.9167, lng: 18.2667 },
  "mossel-bay": { lat: -34.1831, lng: 22.1461 },
  "famous": { lat: -32.3125, lng: 18.3031 },
  "buffels-bay": { lat: -34.3213, lng: 18.4552 },
  "platboom": { lat: -34.3312, lng: 18.4633 },
  "strand": { lat: -34.1147, lng: 18.8306 },
  "hermanus": { lat: -34.4167, lng: 19.2333 },
  "i-n-j-s": { lat: -34.1284, lng: 18.4485 },
  "clovelly": { lat: -34.1264, lng: 18.4447 },
  "long-beach": { lat: -34.1361, lng: 18.3278 },
  "dunes": { lat: -34.1385, lng: 18.3305 },
  "sandy-bay": { lat: -34.0326, lng: 18.3357 },
  "noordhoek": { lat: -34.1156, lng: 18.3587 },
  "horse-trails": { lat: -34.1556, lng: 18.3227 },
  "the-hoek": { lat: -34.1326, lng: 18.3347 },
  "glen-beach": { lat: -33.9397, lng: 18.3775 }
};

let count = 0;
data = data.map(beach => {
  if (updates[beach.id]) {
    beach.coordinates = updates[beach.id];
    count++;
  }
  return beach;
});

fs.writeFileSync(africaPath, JSON.stringify(data, null, 2));
console.log(`✅ Updated ${count} beaches in africa.json`);
