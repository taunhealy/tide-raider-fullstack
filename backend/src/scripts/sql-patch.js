
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🏗️ Manually patching database schema...');
  await client.connect();
  
  try {
    console.log('➕ Adding isLongboarding column if it does not exist...');
    await client.query('ALTER TABLE "Beach" ADD COLUMN IF NOT EXISTS "isLongboarding" BOOLEAN DEFAULT false;');
    console.log('➕ Adding isFoiling column if it does not exist...');
    await client.query('ALTER TABLE "Beach" ADD COLUMN IF NOT EXISTS "isFoiling" BOOLEAN DEFAULT false;');
    console.log('✅ Columns successfully added/verified!');
  } catch (err) {
    console.error('❌ SQL patch failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
