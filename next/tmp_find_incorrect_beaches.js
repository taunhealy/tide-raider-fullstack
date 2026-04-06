const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8');
const data = JSON.parse(content);

const targetLat = -34.1012;
const targetLng = 18.4987;

const incorrectBeaches = data.filter(beach => {
  return Math.abs(beach.coordinates?.lat - targetLat) < 0.0001 && 
         Math.abs(beach.coordinates?.lng - targetLng) < 0.0001;
});

console.log(`Found ${incorrectBeaches.length} beaches with coordinates [${targetLat}, ${targetLng}]:`);
incorrectBeaches.forEach((beach, i) => {
  console.log(`${i+1}. ID: ${beach.id}, Name: ${beach.name}, Location: ${beach.location}`);
});
