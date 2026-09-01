require('dotenv-flow/config');
const pool = require('../config/database');

const getReferralSettings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM referral_settings ORDER BY updated_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({
        settings: null,
        message: 'No referral settings configured'
      });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get referral settings error:', error);
    res.status(500).json({ error: 'Failed to fetch referral settings' });
  }
};

const updateReferralSettings = async (req, res) => {
  const {
    is_enabled,
    reward_type,
    new_customer_reward_value,
    referrer_reward_value,
    minimum_order,
    maximum_discount,
    reward_validity_days
  } = req.body;

  try {
    // Validation
    if (reward_type !== undefined && !['FLAT', 'PERCENT'].includes(reward_type)) {
      return res.status(400).json({ error: 'Reward type must be FLAT or PERCENT' });
    }

    if (new_customer_reward_value !== undefined && new_customer_reward_value <= 0) {
      return res.status(400).json({ error: 'New customer reward value must be greater than 0' });
    }

    if (referrer_reward_value !== undefined && referrer_reward_value <= 0) {
      return res.status(400).json({ error: 'Referrer reward value must be greater than 0' });
    }

    if (reward_type === 'PERCENT') {
      if (new_customer_reward_value !== undefined && new_customer_reward_value > 100) {
        return res.status(400).json({ error: 'New customer percentage reward cannot exceed 100%' });
      }
      if (referrer_reward_value !== undefined && referrer_reward_value > 100) {
        return res.status(400).json({ error: 'Referrer percentage reward cannot exceed 100%' });
      }
    }

    if (minimum_order !== undefined && minimum_order < 0) {
      return res.status(400).json({ error: 'Minimum order cannot be negative' });
    }

    if (maximum_discount !== undefined && maximum_discount < 0) {
      return res.status(400).json({ error: 'Maximum discount cannot be negative' });
    }

    if (reward_validity_days !== undefined && reward_validity_days < 0) {
      return res.status(400).json({ error: 'Reward validity days cannot be negative' });
    }

    // Check if settings exist
    const existingSettings = await pool.query(
      'SELECT id FROM referral_settings ORDER BY updated_at DESC LIMIT 1'
    );

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramCount++}`);
      values.push(is_enabled);
    }
    if (reward_type !== undefined) {
      updates.push(`reward_type = $${paramCount++}`);
      values.push(reward_type);
    }
    if (new_customer_reward_value !== undefined) {
      updates.push(`new_customer_reward_value = $${paramCount++}`);
      values.push(new_customer_reward_value);
    }
    if (referrer_reward_value !== undefined) {
      updates.push(`referrer_reward_value = $${paramCount++}`);
      values.push(referrer_reward_value);
    }
    if (minimum_order !== undefined) {
      updates.push(`minimum_order = $${paramCount++}`);
      values.push(minimum_order);
    }
    if (maximum_discount !== undefined) {
      updates.push(`maximum_discount = $${paramCount++}`);
      values.push(maximum_discount);
    }
    if (reward_validity_days !== undefined) {
      updates.push(`reward_validity_days = $${paramCount++}`);
      values.push(reward_validity_days);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    let result;

    if (existingSettings.rows.length === 0) {
      // Create new settings
      const insertQuery = `
        INSERT INTO referral_settings (${updates.map(u => u.split(' = ')[0]).join(', ')})
        VALUES (${updates.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *
      `;
      result = await pool.query(insertQuery, values);
    } else {
      // Update existing settings
      values.push(existingSettings.rows[0].id);
      const updateQuery = `
        UPDATE referral_settings
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      result = await pool.query(updateQuery, values);
    }

    res.json({
      message: 'Referral settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Update referral settings error:', error);
    res.status(500).json({ error: 'Failed to update referral settings' });
  }
};

module.exports = {
  getReferralSettings,
  updateReferralSettings
};