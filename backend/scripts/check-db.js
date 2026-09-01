require('dotenv-flow/config');
const pool = require('../src/config/database');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables:', result.rows.map(r => r.table_name));
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();