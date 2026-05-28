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
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, credits: true, roles: true }
    });
    console.log('--- ALL USERS IN DB ---');
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
