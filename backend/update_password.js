const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://srrfashions_user:SrrFashions2024!SecureDB@localhost:5432/srrfashions_db'
});

async function updatePassword() {
  try {
    const hash = bcrypt.hashSync('TestPass@123', 10);
    console.log('Generated hash:', hash);
    
    const result = await pool.query(
      'UPDATE users SET password_hash =  WHERE email =  RETURNING id, email',
      [hash, 'aarav.sharma@example.com']
    );
    
    console.log('Password updated for user:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

updatePassword();
