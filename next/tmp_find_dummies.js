const fs = require('fs');
const data = JSON.parse(fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8'));
const dummies = data.filter(b => b.coordinates && b.coordinates.lat === -34.1234);
console.log(JSON.stringify(dummies.map(b => ({id: b.id, name: b.name, location: b.location})), null, 2));
