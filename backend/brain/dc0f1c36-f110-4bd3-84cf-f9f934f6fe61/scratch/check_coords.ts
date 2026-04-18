import fs from 'fs';
import path from 'path';

const africaPath = 'k:/Kea/tide-raider-fullstack/next/app/data/continents/africa.json';
const data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

const targets = [
  "Donkin Bay", "I&J's", "Glen Beach", "Long Beach", "Clovelly", 
  "Dunes", "Sandy Bay", "Noordhoek", "Horse Trails", "Mossel Bay", 
  "The Hoek", "Famous"
];

const results = data.filter(b => targets.some(t => b.name.includes(t)));

results.forEach(b => {
  console.log(`${b.name} (${b.id}): ${JSON.stringify(b.coordinates)}`);
});
