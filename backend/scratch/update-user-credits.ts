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
    const updateResult = await prisma.user.updateMany({
      data: {
        credits: 100
      }
    });
    console.log(`✅ Successfully updated ${updateResult.count} users to have 100 credits/points.`);
    
    // Log the updated users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, credits: true }
    });
    console.log('--- UPDATED USERS ---', users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
