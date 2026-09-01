require('dotenv-flow/config');
const { Pool } = require('pg');

async function createDatabase() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1).split('?')[0];
  const postgresUrl = process.env.DATABASE_URL.replace(dbName, 'postgres');

  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created successfully`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database ${dbName} already exists`);
    } else {
      console.error('Error creating database:', err);
      throw err;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();