require('dotenv-flow/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  validateEmail,
  validatePassword,
  validateChangePassword
} = require('../validators/auth');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role, is_active
       FROM users
       WHERE email = $1 AND role = $2`,
      [email.toLowerCase(), 'ADMIN']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Admin login successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  const validationErrors = validateChangePassword(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const new_password_hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [new_password_hash, new Date(), req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = {
  adminLogin,
  changePassword
};