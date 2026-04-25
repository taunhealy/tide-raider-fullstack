const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function countLogs() {
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
    
    const res = await client.query('SELECT count(*) FROM "LogEntry"');
    console.log('LogEntry count:', res.rows[0].count);
    
    if (res.rows[0].count > 0) {
      const latest = await client.query('SELECT id, date, "beachName", "surferName" FROM "LogEntry" ORDER BY date DESC LIMIT 5');
      console.log('Latest 5 logs:', latest.rows);
    }

  } catch (err) {
    console.error('Error counting logs:', err.stack);
  } finally {
    await client.end();
  }
}

countLogs();
