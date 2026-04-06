const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8');
const data = JSON.parse(content);
const badCoords = ["-34.1234,18.4567", "-34.1123,18.4876", "0,0"];
const list = data.filter(b => badCoords.includes(`${b.coordinates.lat},${b.coordinates.lng}`));
list.forEach(b => console.log(`${b.id}|${b.name}|${b.location}|${b.coordinates.lat},${b.coordinates.lng}`));
