const fs = require('fs');
const path = require('path');

const africaPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'continents', 'africa.json');
const data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

const targets = ['i-and-js', 'i&js', 'glencairn'];
const matches = data.filter(b => targets.includes(b.id));

console.log(JSON.stringify(matches, null, 2));
