const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8');
const data = JSON.parse(content);
const targetLat = -34.1012;
const targetLng = 18.4987;
const incorrect = data.filter(b => Math.abs(b.coordinates?.lat - targetLat) < 0.0001);
incorrect.forEach(b => console.log(`${b.id}|${b.name}|${b.location}`));
