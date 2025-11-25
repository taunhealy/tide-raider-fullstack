// test-db.js
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log('🔍 Testing database connection...');
console.log('📝 Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: true }
});

client.connect()
  .then(() => {
    console.log('✅ Connection succeeded!');
    return client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\' LIMIT 5;');
  })
  .then(res => {
    console.log('\n📊 Sample tables from your database:');
    console.table(res.rows);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check your .env file has the correct DATABASE_URL');
    console.log('   - Verify DNS settings (1.1.1.1 and 8.8.8.8)');
    console.log('   - Try: ipconfig /flushdns');
  })
  .finally(() => client.end());
