const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8');
const data = JSON.parse(content);
const coordCounts = {};
data.forEach(b => {
  const key = `${b.coordinates.lat},${b.coordinates.lng}`;
  coordCounts[key] = (coordCounts[key] || 0) + 1;
});
const duplicates = Object.entries(coordCounts).filter(([k, v]) => v > 1).sort((a,b) => b[1] - a[1]);
duplicates.forEach(([k, v]) => console.log(`${k}: ${v} beaches`));
