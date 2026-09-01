require('dotenv-flow/config');
const pool = require('../config/database');

const createCoupon = async (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    minimum_order,
    maximum_discount,
    start_date,
    expiry_date,
    total_usage_limit,
    usage_limit_per_customer,
    is_active
  } = req.body;

  // Validation
  if (!code || code.trim().length === 0) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  if (!['FLAT', 'PERCENT'].includes(discount_type)) {
    return res.status(400).json({ error: 'Discount type must be FLAT or PERCENT' });
  }

  if (!discount_value || discount_value <= 0) {
    return res.status(400).json({ error: 'Discount value must be greater than 0' });
  }

  if (!start_date || !expiry_date) {
    return res.status(400).json({ error: 'Start date and expiry date are required' });
  }

  if (new Date(start_date) >= new Date(expiry_date)) {
    return res.status(400).json({ error: 'Expiry date must be after start date' });
  }

  if (discount_type === 'PERCENT' && discount_value > 100) {
    return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
  }

  try {
    // Check if coupon code already exists
    const existingCoupon = await pool.query(
      'SELECT id FROM coupons WHERE code = $1',
      [code.trim().toUpperCase()]
    );

    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const result = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, minimum_order, maximum_discount, start_date, expiry_date, total_usage_limit, usage_limit_per_customer, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        code.trim().toUpperCase(),
        discount_type,
        discount_value,
        minimum_order || 0,
        maximum_discount || null,
        start_date,
        expiry_date,
        total_usage_limit || null,
        usage_limit_per_customer || null,
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const {
    code,
    discount_type,
    discount_value,
    minimum_order,
    maximum_discount,
    start_date,
    expiry_date,
    total_usage_limit,
    usage_limit_per_customer,
    is_active
  } = req.body;

  try {
    // Check if coupon exists
    const couponExists = await pool.query(
      'SELECT id FROM coupons WHERE id = $1',
      [id]
    );

    if (couponExists.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Validation
    if (code !== undefined) {
      if (code.trim().length === 0) {
        return res.status(400).json({ error: 'Coupon code cannot be empty' });
      }

      // Check if code is being changed and if new code already exists
      const existingCode = await pool.query(
        'SELECT id FROM coupons WHERE code = $1 AND id != $2',
        [code.trim().toUpperCase(), id]
      );

      if (existingCode.rows.length > 0) {
        return res.status(400).json({ error: 'Coupon code already exists' });
      }
    }

    if (discount_type !== undefined) {
      if (!['FLAT', 'PERCENT'].includes(discount_type)) {
        return res.status(400).json({ error: 'Discount type must be FLAT or PERCENT' });
      }
    }

    if (discount_value !== undefined) {
      if (discount_value <= 0) {
        return res.status(400).json({ error: 'Discount value must be greater than 0' });
      }
    }

    if (start_date !== undefined && expiry_date !== undefined) {
      if (new Date(start_date) >= new Date(expiry_date)) {
        return res.status(400).json({ error: 'Expiry date must be after start date' });
      }
    }

    if (discount_type === 'PERCENT' && discount_value !== undefined && discount_value > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(code.trim().toUpperCase());
    }
    if (discount_type !== undefined) {
      updates.push(`discount_type = $${paramCount++}`);
      values.push(discount_type);
    }
    if (discount_value !== undefined) {
      updates.push(`discount_value = $${paramCount++}`);
      values.push(discount_value);
    }
    if (minimum_order !== undefined) {
      updates.push(`minimum_order = $${paramCount++}`);
      values.push(minimum_order);
    }
    if (maximum_discount !== undefined) {
      updates.push(`maximum_discount = $${paramCount++}`);
      values.push(maximum_discount);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(start_date);
    }
    if (expiry_date !== undefined) {
      updates.push(`expiry_date = $${paramCount++}`);
      values.push(expiry_date);
    }
    if (total_usage_limit !== undefined) {
      updates.push(`total_usage_limit = $${paramCount++}`);
      values.push(total_usage_limit);
    }
    if (usage_limit_per_customer !== undefined) {
      updates.push(`usage_limit_per_customer = $${paramCount++}`);
      values.push(usage_limit_per_customer);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(id);

    const query = `
      UPDATE coupons
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Coupon updated successfully',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if coupon exists
    const couponExists = await pool.query(
      'SELECT id FROM coupons WHERE id = $1',
      [id]
    );

    if (couponExists.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check if coupon is referenced in any orders
    const orderReferences = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE coupon_id = $1',
      [id]
    );

    if (parseInt(orderReferences.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete coupon that is referenced in orders'
      });
    }

    // Delete coupon usages first
    await pool.query('DELETE FROM coupon_usages WHERE coupon_id = $1', [id]);

    // Delete coupon
    await pool.query('DELETE FROM coupons WHERE id = $1', [id]);

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

const updateCouponStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active status is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE coupons
       SET is_active = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [is_active, new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({
      message: 'Coupon status updated successfully',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Update coupon status error:', error);
    res.status(500).json({ error: 'Failed to update coupon status' });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              COUNT(DISTINCT cu.user_id) as unique_customers_used,
              COUNT(cu.id) as total_usage_count
       FROM coupons c
       LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    res.json({ coupons: result.rows });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

module.exports = {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  updateCouponStatus,
  getAllCoupons
};