import fs from 'fs';

const africaPath = 'k:/Kea/tide-raider-fullstack/next/app/data/continents/africa.json';
let data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

const hiddenGemIds = [
  "seafarm-pringle-bay", "palmiet-reef", "bellows", "kogelberg-reef", 
  "moonlight-bay", "harold-porter", "nine-miles", "i&js", 
  "derdesteen", "platboom", "thermopylae", "virgin-point", "dungeons"
];

let count = 0;
data = data.map(beach => {
  if (hiddenGemIds.includes(beach.id)) {
    beach.isHiddenGem = true;
    count++;
  }
  return beach;
});

fs.writeFileSync(africaPath, JSON.stringify(data, null, 2));
console.log(`✅ Marked ${count} beaches as Hidden Gems in africa.json`);
