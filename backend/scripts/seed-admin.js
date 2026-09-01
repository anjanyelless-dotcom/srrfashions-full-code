require('dotenv-flow/config');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

async function seedAdmin() {
  const adminEmail = 'admin@taxserves.com';
  const adminPassword = 'Admin@123';
  const adminFullName = 'System Administrator';

  try {
    console.log('Checking if admin user exists...');

    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      [adminEmail, 'ADMIN']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    console.log('Creating admin user...');

    const password_hash = await bcrypt.hash(adminPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, mobile_number, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role`,
      [adminFullName, adminEmail, '0000000000', password_hash, 'ADMIN', true]
    );

    console.log('Admin user created successfully:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User ID:', result.rows[0].id);

  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedAdmin();