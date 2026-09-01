require('dotenv-flow/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  validateRegistrationData,
  validateLoginData,
  validateProfileUpdate,
  validateChangePassword
} = require('../validators/auth');

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'FASHION-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const customerRegister = async (req, res) => {
  const { full_name, email, mobile_number, password, referral_code: referralCode } = req.body;

  const validationErrors = validateRegistrationData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Check for existing email
    const emailExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for existing mobile number
    const mobileExists = await pool.query(
      'SELECT id FROM users WHERE mobile_number = $1',
      [mobile_number]
    );
    if (mobileExists.rows.length > 0) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Handle referral code if provided
    let referred_by_user_id = null;
    if (referralCode) {
      const referralUser = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode.toUpperCase()]
      );
      if (referralUser.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
      referred_by_user_id = referralUser.rows[0].id;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate unique referral code
    let referral_code = generateReferralCode();
    let codeExists = true;
    while (codeExists) {
      const existingCode = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referral_code]
      );
      if (existingCode.rows.length === 0) {
        codeExists = false;
      } else {
        referral_code = generateReferralCode();
      }
    }

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, mobile_number, password_hash, role, referral_code, referred_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, mobile_number, role, referral_code`,
      [full_name, email.toLowerCase(), mobile_number, password_hash, 'CUSTOMER', referral_code, referred_by_user_id]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        referral_code: user.referral_code
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const customerLogin = async (req, res) => {
  const { identifier, password } = req.body;

  const validationErrors = validateLoginData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Find user by email or mobile number
    const result = await pool.query(
      `SELECT id, full_name, email, mobile_number, password_hash, role, is_active
       FROM users
       WHERE (email = $1 OR mobile_number = $2) AND role = $3`,
      [identifier.toLowerCase(), identifier, 'CUSTOMER']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, mobile_number, role, referral_code, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  const { full_name, email, mobile_number } = req.body;

  const validationErrors = validateProfileUpdate(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Check for duplicate email if changing email
    if (email && email.toLowerCase() !== req.body.current_email) {
      const emailExists = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), req.user.id]
      );
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Check for duplicate mobile number if changing mobile
    if (mobile_number && mobile_number !== req.body.current_mobile) {
      const mobileExists = await pool.query(
        'SELECT id FROM users WHERE mobile_number = $1 AND id != $2',
        [mobile_number, req.user.id]
      );
      if (mobileExists.rows.length > 0) {
        return res.status(400).json({ error: 'Mobile number already registered' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }
    if (mobile_number !== undefined) {
      updates.push(`mobile_number = $${paramCount++}`);
      values.push(mobile_number);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(req.user.id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, full_name, email, mobile_number, role, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [new_password_hash, new Date(), req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = {
  customerRegister,
  customerLogin,
  getProfile,
  updateProfile,
  changePassword
};