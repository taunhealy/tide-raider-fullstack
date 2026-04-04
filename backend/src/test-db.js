const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing connection to:', connectionString ? connectionString.split('@')[1] : 'undefined');

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    
    const res = await client.query('SELECT count(*) FROM "Region"');
    console.log('Region count:', res.rows[0].count);
    
    const regions = await client.query('SELECT id, name FROM "Region" LIMIT 5');
    console.log('Sample regions:', regions.rows);
    
    const bali = await client.query('SELECT * FROM "Region" WHERE id = \'bali\' OR name ILIKE \'%bali%\'');
    console.log('Bali search result:', bali.rows);

  } catch (err) {
    console.error('Connection error:', err.stack);
  } finally {
    await client.end();
  }
}

testConnection();
