const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://srrfashions_user:SrrFashions2024!SecureDB@localhost:5432/srrfashions_db'
});

async function createTestUser() {
  try {
    const hash = bcrypt.hashSync('Test@123', 10);
    console.log('Generated hash:', hash);
    
    const result = await pool.query(
      'INSERT INTO users (full_name, email, mobile_number, password_hash, role, is_active) VALUES (, , , , , ) RETURNING id, email, password_hash',
      ['Test Customer', 'testcustomer@srrfashions.in', '8888888888', hash, 'CUSTOMER', true]
    );
    
    console.log('Test user created:', result.rows[0]);
    console.log('Stored hash length:', result.rows[0].password_hash.length);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
