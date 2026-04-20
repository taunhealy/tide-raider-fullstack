import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function sync() {
  const africaPath = path.join(__dirname, '../../../next/app/data/continents/africa.json');
  const beaches = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

  console.log(`📡 Syncing ${beaches.length} beaches to DB...`);

  const normalizeDifficulty = (d: string) => {
    const val = d.toUpperCase().replace('-', '_');
    if (val.includes('BEGINNER_INTERMEDIATE')) return 'INTERMEDIATE';
    if (val.includes('INTERMEDIATE_ADVANCED')) return 'ADVANCED';
    return val;
  };

  const normalizeHazards = (hs: string[]) => {
    const validHazards = ['ROCKS', 'CURRENTS', 'SHARKS', 'JELLYFISH', 'POLLUTION', 'RIPTIDES', 'SHALLOW_REEF', 'LOCALISM', 'CROWDS', 'BOAT_TRAFFIC', 'STRONG_UNDERTOW', 'SUBMERGED_OBJECTS'];
    return (hs || []).map(h => {
      const up = h.toUpperCase();
      if (up.includes('ROCK')) return 'ROCKS';
      if (up.includes('CORAL') || up.includes('REEF')) return 'SHALLOW_REEF';
      if (up.includes('SHARK')) return 'SHARKS';
      if (up.includes('CURRENT')) return 'CURRENTS';
      if (up.includes('LOCAL')) return 'LOCALISM';
      if (up.includes('RIP')) return 'RIPTIDES';
      if (up.includes('CROWD')) return 'CROWDS';
      if (up.includes('JELLY')) return 'JELLYFISH';
      return null;
    }).filter(h => h !== null) as any[];
  };

  const normalizeWaveType = (w: string) => {
    const val = w.toUpperCase().replace(' ', '_').replace('-', '_');
    if (val.includes('BEACH')) return 'BEACH_BREAK';
    if (val.includes('POINT')) return 'POINT_BREAK';
    if (val.includes('REEF')) return 'REEF_BREAK';
    if (val.includes('BIG_WAVE')) return 'POINT_BREAK'; // Fallback
    return 'BEACH_BREAK';
  };
  const normalizeTide = (t: string) => {
     const up = t.toUpperCase().replace(' ', '_').replace('-', '_');
     if (up.includes('LOW_TO_MID') || up.includes('LOW_MID')) return 'LOW_TO_MID';
     if (up.includes('MID_TO_HIGH') || up.includes('MID_HIGH')) return 'MID_TO_HIGH';
     if (up.includes('ALL')) return 'ALL';
     if (up.includes('LOW')) return 'LOW';
     if (up.includes('MID')) return 'MID';
     if (up.includes('HIGH')) return 'HIGH';
     return 'UNKNOWN';
  };
  const normalizeScore = (s: any) => (typeof s === 'number' ? s : 0);
  const normalizeCrime = (c: string) => {
    const up = c.toUpperCase();
    if (up.includes('LOW')) return 'LOW';
    if (up.includes('MED')) return 'MEDIUM';
    if (up.includes('HIGH')) return 'HIGH';
    return 'LOW';
  };
  const normalizeShark = (s: any) => {
    if (!s) return 'NONE';
    if (typeof s === 'object') {
       if (s.hasAttack) return 'HIGH';
       return 'LOW';
    }
    const up = String(s).toUpperCase();
    if (up.includes('EXTREME')) return 'EXTREME';
    if (up.includes('HIGH')) return 'HIGH';
    if (up.includes('MODERATE')) return 'MODERATE';
    if (up.includes('LOW')) return 'LOW';
    return 'NONE';
  };

  for (const beachData of beaches) {
    try {
      await prisma.beach.upsert({
        where: { id: beachData.id },
        update: {
          name: beachData.name,
          regionId: beachData.regionId,
          countryId: beachData.countryId,
          continent: beachData.continent,
          location: beachData.location,
          distanceFromCT: beachData.distanceFromCT,
          optimalWindDirections: beachData.optimalWindDirections,
          optimalSwellDirections: beachData.optimalSwellDirections,
          bestSeasons: (beachData.bestSeasons || []).map((s: string) => s.toUpperCase()),
          optimalTide: normalizeTide(beachData.optimalTide || ""),
          description: beachData.description,
          difficulty: normalizeDifficulty(beachData.difficulty),
          waveType: normalizeWaveType(beachData.waveType),
          swellSize: beachData.swellSize,
          idealSwellPeriod: beachData.idealSwellPeriod,
          waterTemp: beachData.waterTemp,
          hazards: normalizeHazards(beachData.hazards),
          crimeLevel: normalizeCrime(beachData.crimeLevel || "Low"),
          sharkAttack: normalizeShark(beachData.sharkAttack),
          coordinates: beachData.coordinates,
          isHiddenGem: beachData.isHiddenGem || false,
        },
        create: {
          id: beachData.id,
          name: beachData.name,
          regionId: beachData.regionId,
          countryId: beachData.countryId,
          continent: beachData.continent,
          location: beachData.location,
          distanceFromCT: beachData.distanceFromCT,
          optimalWindDirections: beachData.optimalWindDirections,
          optimalSwellDirections: beachData.optimalSwellDirections,
          bestSeasons: (beachData.bestSeasons || []).map((s: string) => s.toUpperCase()),
          optimalTide: normalizeTide(beachData.optimalTide || ""),
          description: beachData.description,
          difficulty: normalizeDifficulty(beachData.difficulty),
          waveType: normalizeWaveType(beachData.waveType),
          swellSize: beachData.swellSize,
          idealSwellPeriod: beachData.idealSwellPeriod,
          waterTemp: beachData.waterTemp,
          hazards: normalizeHazards(beachData.hazards),
          crimeLevel: normalizeCrime(beachData.crimeLevel || "Low"),
          sharkAttack: normalizeShark(beachData.sharkAttack),
          coordinates: beachData.coordinates,
          isHiddenGem: beachData.isHiddenGem || false,
        }
      });
    } catch (e) {
      console.error(`❌ Error syncing beach ${beachData.id}:`, e);
    }
  }

  console.log('✅ Sync complete.');
  process.exit(0);
}

sync();
