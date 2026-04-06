const fs = require('fs');
const path = 'k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json';
const content = fs.readFileSync(path, 'utf8');
const data = JSON.parse(content);
const target = data.find(b => b.id === 'outer-kom');
if (target) {
  target.coordinates = { lat: -34.138, lng: 18.324 };
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Fixed Outer Kom');
} else {
  console.log('Outer Kom not found');
}
