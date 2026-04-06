const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8');
const data = JSON.parse(content);
const names = ['Pringle Bay', 'Danger Beach', 'Farmer Burger', 'Herolds Bay'];
const results = data.filter(b => names.some(n => b.name.includes(n) || b.id.includes(n.toLowerCase().replace(/ /g, '-'))));
results.forEach(b => console.log(`${b.id}|${b.name}|${b.coordinates.lat}|${b.coordinates.lng}`));
