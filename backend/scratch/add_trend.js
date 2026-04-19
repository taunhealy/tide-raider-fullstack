process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const client = new Client({ 
  connectionString: 'postgresql://postgres.pffssccmdbopnlgjdhwh:SupabaseIsSupafly@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE "Forecast" ADD COLUMN IF NOT EXISTS "trend" TEXT');
    console.log('Trend column added!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
