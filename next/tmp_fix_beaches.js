const fs = require('fs');
const path = 'k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json';
const content = fs.readFileSync(path, 'utf8');
const data = JSON.parse(content);

const corrections = {
  'dunes': { lat: -34.1385, lng: 18.3305 },
  'scarborough': { lat: -34.1995, lng: 18.3725 },
  'derdesteen': { lat: -33.7842, lng: 18.4526 },
  'kogel-bay': { lat: -34.2356, lng: 18.8557 },
  'langebaan': { lat: -33.0956, lng: 18.0357 },
  'sandy-bay': { lat: -34.0326, lng: 18.3357 },
  'inner-kom': { lat: -34.1396, lng: 18.3287 },
  'noordhoek': { lat: -34.1156, lng: 18.3587 },
  'misty-cliffs': { lat: -34.1856, lng: 18.3617 },
  'horse-trails': { lat: -34.1556, lng: 18.3227 },
  'cemetery': { lat: -34.1286, lng: 18.4527 },
  'the-hoek': { lat: -34.1326, lng: 18.3347 },
  'crons': { lat: -34.1426, lng: 18.3257 },
  'dias-beach': { lat: -34.3496, lng: 18.4757 },
  'thermopylae': { lat: -34.3476, lng: 18.4737 },
  'virgin-point': { lat: -34.3526, lng: 18.4787 },
  'bellows': { lat: -34.3926, lng: 18.4897 },
  'black-rocks': { lat: -34.3426, lng: 18.4767 }
};

let count = 0;
data.forEach(beach => {
  if (corrections[beach.id]) {
    beach.coordinates = corrections[beach.id];
    count++;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Updated ${count} beaches in africa.json`);
