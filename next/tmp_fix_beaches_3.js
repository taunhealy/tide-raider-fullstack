const fs = require('fs');
const path = 'k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json';
const content = fs.readFileSync(path, 'utf8');
const data = JSON.parse(content);

const extraCorrections = {
  // Common Cape Peninsula spots with dummy coords -34.1234, 18.4567
  "witsand": { lat: -34.205, lng: 18.361 },
  "yzerfontein": { lat: -33.344, lng: 18.156 },
  "silverstroom": { lat: -33.585, lng: 18.356 },
  "gabathan": { lat: -34.108, lng: 18.485 },
  "koeel-bay": { lat: -34.235, lng: 18.855 },
  "betty's-bay": { lat: -34.364, lng: 18.916 },
  "rivermouth": { lat: -33.02, lng: 27.91 },
  "nahoon-reef": { lat: -32.99, lng: 27.95 },
  "victoria-bay": { lat: -34.003, lng: 22.548 },
  "jongensfontein": { lat: -34.425, lng: 21.356 },
  "herolds-bay": { lat: -34.055, lng: 22.393 },
  "the-wedge": { lat: -34.051, lng: 18.344 } // Plettenberg Bay wedge? or Hout Bay?
};

let count = 0;
data.forEach(beach => {
  if (extraCorrections[beach.id]) {
    beach.coordinates = extraCorrections[beach.id];
    count++;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Updated ${count} additional beaches in africa.json`);
