require('dotenv-flow/config');
const pool = require('../config/database');

const getCustomers = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;
    const conditions = ["role = 'CUSTOMER'"];
    const values = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR mobile_number ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT
        id,
        full_name,
        email,
        mobile_number,
        referral_code,
        is_active,
        created_at,
        updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      customers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

const getCustomerDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const customerResult = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        mobile_number,
        referral_code,
        referred_by_user_id,
        is_active,
        created_at,
        updated_at
       FROM users
       WHERE id = $1 AND role = 'CUSTOMER'`,
      [id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerResult.rows[0];

    const ordersResult = await pool.query(
      `SELECT
        id,
        order_number,
        final_amount,
        order_status,
        created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    const referralsResult = await pool.query(
      `SELECT
        r.id,
        r.referral_code_used,
        r.status,
        r.created_at,
        r.updated_at,
        u.full_name as referred_user_name,
        u.email as referred_user_email
       FROM referrals r
       LEFT JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_user_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const rewardsResult = await pool.query(
      `SELECT
        rr.id,
        rr.reward_amount,
        rr.is_used,
        rr.is_approved,
        rr.order_id_used_on,
        rr.created_at
       FROM referral_rewards rr
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC`,
      [id]
    );

    const referredByResult = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email
       FROM users u
       WHERE u.id = $1`,
      [customer.referred_by_user_id]
    );

    res.json({
      customer,
      order_history: ordersResult.rows,
      referrals: referralsResult.rows,
      referral_rewards: rewardsResult.rows,
      referred_by: referredByResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
};

const updateCustomerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined || typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active boolean is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET is_active = $1, updated_at = $2
       WHERE id = $3 AND role = 'CUSTOMER'
       RETURNING id, full_name, email, mobile_number, is_active, updated_at`,
      [is_active, new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      message: `Customer ${is_active ? 'activated' : 'deactivated'} successfully`,
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Update customer status error:', error);
    res.status(500).json({ error: 'Failed to update customer status' });
  }
};

module.exports = {
  getCustomers,
  getCustomerDetail,
  updateCustomerStatus
};
