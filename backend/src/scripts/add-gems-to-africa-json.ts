import fs from 'fs';
import path from 'path';
import { beachData } from '../data/beachData';

async function main() {
  const africaPath = path.join(__dirname, '../data/continents/africa.json');
  const existingAfricaBeaches = JSON.parse(fs.readFileSync(africaPath, 'utf8'));
  console.log(`Current beaches in africa.json: ${existingAfricaBeaches.length}`);

  // The 6 new gems: "kribi", "grosse-bucht", "cato", "shela-beach", "madirokely", "playa-de-estoril"
  const targetIds = ["kribi", "grosse-bucht", "cato", "shela-beach", "madirokely", "playa-de-estoril"];
  
  const newGems = beachData.filter(b => targetIds.includes(b.id));
  console.log(`Found ${newGems.length} new gems in beachData.ts`);

  for (const gem of newGems) {
    // Check if already exists in africa.json
    if (existingAfricaBeaches.some((b: any) => b.id === gem.id)) {
      console.log(`Beach ${gem.name} (${gem.id}) already exists in africa.json. Skipping.`);
      continue;
    }

    // Format the beach to match the schema of africa.json (nested conditionProfiles)
    const formattedGem: any = {
      id: gem.id,
      name: gem.name,
      continent: gem.continent,
      countryId: gem.countryId,
      regionId: gem.regionId,
      location: gem.location,
      isHiddenGem: gem.isHiddenGem ?? true,
      distanceFromCT: gem.distanceFromCT ?? 0,
      bestSeasons: gem.bestSeasons ?? [],
      description: gem.description,
      difficulty: gem.difficulty,
      waveType: gem.waveType,
      waterTemp: gem.waterTemp,
      hazards: gem.hazards ?? [],
      crimeLevel: gem.crimeLevel ?? "Low",
      sharkAttack: gem.sharkAttack ?? { hasAttack: false },
      coordinates: gem.coordinates,
      conditionProfiles: {
        GENERAL: {
          optimalWindDirections: gem.optimalWindDirections ?? [],
          optimalSwellDirections: gem.optimalSwellDirections ?? {},
          optimalTide: gem.optimalTide ?? "ALL",
          swellSize: gem.swellSize ?? {},
          idealSwellPeriod: gem.idealSwellPeriod ?? {}
        }
      }
    };

    if (gem.isLongboarding) formattedGem.isLongboarding = true;
    if (gem.isFoiling) formattedGem.isFoiling = true;

    existingAfricaBeaches.push(formattedGem);
    console.log(`Added ${gem.name} (${gem.id}) to africa.json`);
  }

  // Save the updated africa.json
  fs.writeFileSync(africaPath, JSON.stringify(existingAfricaBeaches, null, 2), 'utf8');
  console.log(`Updated africa.json successfully! New total: ${existingAfricaBeaches.length}`);
}

main().catch(console.error);
