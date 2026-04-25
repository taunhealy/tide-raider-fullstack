const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function checkPrivacy() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, "isPrivate", "isAnonymous", "beachName" FROM "LogEntry"');
    console.log('Logs privacy status:');
    res.rows.forEach(row => {
      console.log(`- ${row.beachName}: Private=${row.isPrivate}, Anonymous=${row.isAnonymous}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkPrivacy();
