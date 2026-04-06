const fs = require('fs');
const path = 'k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json';
const content = fs.readFileSync(path, 'utf8');
const data = JSON.parse(content);

const moreCorrections = {
  'pringle-bay': { lat: -34.3424, lng: 18.8282 },
  'herolds-bay': { lat: -34.0551, lng: 22.3936 },
  'farmer-burgers': { lat: -32.1709, lng: 18.3115 },
  'danger-beach': { lat: -34.1216, lng: 18.4561 } // Kalk Bay side
};

let count = 0;
data.forEach(beach => {
  if (moreCorrections[beach.id]) {
    beach.coordinates = moreCorrections[beach.id];
    count++;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Updated ${count} beaches in africa.json`);
