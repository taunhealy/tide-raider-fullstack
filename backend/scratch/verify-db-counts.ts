import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Force load env.local first
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading env from:', envLocalPath);
  dotenv.config({ path: envLocalPath });
} else {
  console.log('Loading env from:', envPath);
  dotenv.config({ path: envPath });
}

import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    console.log('DATABASE_URL being used:', process.env.DATABASE_URL?.substring(0, 80) + '...');
    
    const continents = await prisma.continent.count();
    const countries = await prisma.country.count();
    const regions = await prisma.region.count();
    const beaches = await prisma.beach.count();
    
    console.log('--- DATABASE STATUS ---');
    console.log('Continents:', continents);
    console.log('Countries:', countries);
    console.log('Regions:', regions);
    console.log('Beaches:', beaches);
    
    if (beaches > 0) {
      const sample = await prisma.beach.findFirst({
        select: { id: true, name: true, regionId: true }
      });
      console.log('Sample Beach:', sample);
    }
  } catch (err) {
    console.error('Error running count check:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
