const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\next\\app\\data\\continents\\africa.json', 'utf8');
const data = JSON.parse(content);
const targetIds = ['dunes', 'derdesteen', 'kogel-bay', 'langebaan', 'sandy-bay', 'inner-kom', 'noordhoek', 'misty-cliffs', 'horse-trails', 'cemetery', 'the-hoek', 'crons', 'dias-beach', 'thermopylae', 'virgin-point', 'bellows', 'black-rocks', 'scarborough'];
const results = data.filter(b => targetIds.includes(b.id));
results.forEach(b => console.log(`${b.id}|${b.coordinates.lat}|${b.coordinates.lng}`));
