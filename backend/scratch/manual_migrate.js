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
    
    // Create Enum if not exists
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TimeSlot') THEN 
          CREATE TYPE "TimeSlot" AS ENUM ('MORNING', 'NOON', 'EVENING'); 
        END IF; 
      END $$;
    `);
    
    // Add columns
    await client.query('ALTER TABLE "Forecast" ADD COLUMN IF NOT EXISTS "timeSlot" "TimeSlot" DEFAULT \'MORNING\'');
    await client.query('ALTER TABLE "BeachDailyScore" ADD COLUMN IF NOT EXISTS "timeSlot" "TimeSlot" DEFAULT \'MORNING\'');
    
    // Update unique constraints if needed, but for now just getting columns in
    console.log('Columns added successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
