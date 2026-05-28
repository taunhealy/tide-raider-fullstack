import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    const count = await prisma.intelligenceReport.count();
    console.log('Total Intelligence Reports in DB:', count);
    
    if (count > 0) {
      const reports = await prisma.intelligenceReport.findMany({
        take: 5,
        include: { beach: true }
      });
      console.log('Sample Reports:', reports);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
