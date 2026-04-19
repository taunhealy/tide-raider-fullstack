process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const client = new Client({ 
  connectionString: 'postgresql://postgres.pffssccmdbopnlgjdhwh:SupabaseIsSupafly@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected');
    
    // 1. Forecast Constraints
    console.log('Updating Forecast constraints...');
    // Drop old constraint if it exists (usually named Forecast_date_regionId_source_key)
    try {
      await client.query('ALTER TABLE "Forecast" DROP CONSTRAINT IF EXISTS "Forecast_date_regionId_source_key"');
    } catch(e) { console.log('Constraint Forecast_date_regionId_source_key not found or already gone'); }
    
    // Add new unique constraint
    try {
      await client.query('ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_date_regionId_source_timeSlot_key" UNIQUE ("date", "regionId", "source", "timeSlot")');
    } catch(e) { console.log('Constraint Forecast_date_regionId_source_timeSlot_key might already exist'); }

    // 2. BeachDailyScore Constraints
    console.log('Updating BeachDailyScore constraints...');
    try {
      await client.query('ALTER TABLE "BeachDailyScore" DROP CONSTRAINT IF EXISTS "BeachDailyScore_beachId_date_source_key"');
    } catch(e) { console.log('Constraint BeachDailyScore_beachId_date_source_key not found or already gone'); }
    
    try {
      await client.query('ALTER TABLE "BeachDailyScore" ADD CONSTRAINT "BeachDailyScore_beachId_date_source_timeSlot_key" UNIQUE ("beachId", "date", "source", "timeSlot")');
    } catch(e) { console.log('Constraint BeachDailyScore_beachId_date_source_timeSlot_key might already exist'); }

    console.log('Constraints updated successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
