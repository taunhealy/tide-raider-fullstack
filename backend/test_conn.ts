
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const url = process.env.DATABASE_URL;
  console.log('Testing connection to:', url?.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Successfully connected to Postgres!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();
