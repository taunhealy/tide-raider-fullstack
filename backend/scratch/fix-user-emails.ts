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
    console.log('🔄 Healing recovered user profiles...');

    // 1. Recover cmn4owtab0000s60f0dosfbck -> Taun / taunhealy@gmail.com
    await prisma.user.update({
      where: { id: 'cmn4owtab0000s60f0dosfbck' },
      data: {
        name: 'Taun',
        email: 'taunhealy@gmail.com',
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: new Date('2030-01-01'),
        roles: ['SURFER']
      }
    });
    console.log('✅ Restored user Taun (taunhealy@gmail.com)');

    // 2. Recover cmn4eu8zj0000v0p4amxlfxad -> dummy.surfer1@example.com (if dummy surfer)
    await prisma.user.update({
      where: { id: 'cmn4eu8zj0000v0p4amxlfxad' },
      data: {
        name: 'Dummy Surfer 1',
        email: 'dummy.surfer1@example.com'
      }
    });
    console.log('✅ Restored user Dummy Surfer 1');

    // 3. Recover cmnhjq35d000cs60fxss02p4o -> admin@tideraider.com (which exists but had a duplicate placeholder)
    // Wait! Let's check if cmnhjq35d000cs60fxss02p4o in the logs has the same email.
    // Yes, logs for cmnhjq35d000cs60fxss02p4o had surferEmail: admin@tideraider.com and surferName: Tide Raider.
    // Let's set its email to 'tideraider.admin@tideraider.com' or keep it as is.
    await prisma.user.update({
      where: { id: 'cmnhjq35d000cs60fxss02p4o' },
      data: {
        name: 'Tide Raider',
        email: 'tideraider.admin@tideraider.com'
      }
    });
    console.log('✅ Restored user Tide Raider');

    console.log('🎉 All user profiles healed successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
