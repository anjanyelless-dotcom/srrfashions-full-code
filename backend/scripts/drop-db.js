require('dotenv-flow/config');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function dropDatabase() {
  const dbName = process.env.DATABASE_URL.split('/').pop().split('?')[0];
  const client = await pool.connect();

  try {
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`Database ${dbName} dropped successfully`);
  } catch (err) {
    console.error('Error dropping database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

dropDatabase();