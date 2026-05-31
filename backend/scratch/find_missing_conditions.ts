import * as fs from 'fs';
import * as path from 'path';

const continentsDir = path.join(__dirname, '../src/data/continents');
const files = fs.readdirSync(continentsDir).filter(f => f.endsWith('.json'));

console.log("Analyzing beaches for missing optimal conditions...\n");

let totalBeaches = 0;
const missingWind = [];
const missingSwellDir = [];
const missingWaveSize = [];
const missingPeriod = [];

for (const file of files) {
  const filePath = path.join(continentsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  for (const beach of data) {
    totalBeaches++;
    const name = beach.name;
    const region = beach.regionId || beach.region || beach.country || 'Unknown';
    
    // Check general profile or root properties
    const generalProfile = beach.conditionProfiles?.GENERAL || {};
    
    const wind = beach.optimalWindDirections || generalProfile.optimalWindDirections;
    const swellDir = beach.optimalSwellDirections || generalProfile.optimalSwellDirections;
    const swellSz = beach.swellSize || generalProfile.swellSize;
    const swellPd = beach.idealSwellPeriod || generalProfile.idealSwellPeriod;
    
    if (!wind || wind.length === 0) {
      missingWind.push(`${name} (${region})`);
    }
    if (!swellDir || (swellDir.min === undefined && swellDir.max === undefined)) {
      missingSwellDir.push(`${name} (${region})`);
    }
    if (!swellSz || (swellSz.min === undefined && swellSz.max === undefined)) {
      missingWaveSize.push(`${name} (${region})`);
    }
    if (!swellPd || (swellPd.min === undefined && swellPd.max === undefined)) {
      missingPeriod.push(`${name} (${region})`);
    }
  }
}

console.log(`Total beaches analyzed: ${totalBeaches}\n`);

console.log(`--- Beaches with NO Optimal Wind Directions (${missingWind.length}) ---`);
console.log(missingWind.slice(0, 15).join('\n'));
if (missingWind.length > 15) console.log(`... and ${missingWind.length - 15} more.`);

console.log(`\n--- Beaches with NO Optimal Swell Directions (${missingSwellDir.length}) ---`);
console.log(missingSwellDir.slice(0, 15).join('\n'));
if (missingSwellDir.length > 15) console.log(`... and ${missingSwellDir.length - 15} more.`);

console.log(`\n--- Beaches with NO Optimal Wave Size/Height (${missingWaveSize.length}) ---`);
console.log(missingWaveSize.slice(0, 15).join('\n'));
if (missingWaveSize.length > 15) console.log(`... and ${missingWaveSize.length - 15} more.`);

console.log(`\n--- Beaches with NO Optimal Swell Period (${missingPeriod.length}) ---`);
console.log(missingPeriod.slice(0, 15).join('\n'));
if (missingPeriod.length > 15) console.log(`... and ${missingPeriod.length - 15} more.`);
