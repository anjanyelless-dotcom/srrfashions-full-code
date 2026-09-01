require('dotenv-flow/config');
const pool = require('../config/database');

const validatePincode = (pincode) => {
  // Indian pincode validation: 6 digits numeric
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

const validateMobileNumber = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

const addAddress = async (req, res) => {
  const { name, mobile_number, house_flat, street_area, city, state, pincode, landmark, is_default } = req.body;
  const userId = req.user.id;

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!mobile_number || !validateMobileNumber(mobile_number)) {
    return res.status(400).json({ error: 'Invalid mobile number format' });
  }

  if (!house_flat || house_flat.trim().length === 0) {
    return res.status(400).json({ error: 'House/flat number is required' });
  }

  if (!street_area || street_area.trim().length === 0) {
    return res.status(400).json({ error: 'Street/area is required' });
  }

  if (!city || city.trim().length === 0) {
    return res.status(400).json({ error: 'City is required' });
  }

  if (!state || state.trim().length === 0) {
    return res.status(400).json({ error: 'State is required' });
  }

  if (!pincode || !validatePincode(pincode)) {
    return res.status(400).json({ error: 'Invalid pincode. Must be 6 digits' });
  }

  try {
    // If setting as default, unset previous default
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // Add new address
    const result = await pool.query(
      `INSERT INTO addresses (user_id, name, mobile_number, house_flat, street_area, city, state, pincode, landmark, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        name.trim(),
        mobile_number,
        house_flat.trim(),
        street_area.trim(),
        city.trim(),
        state.trim(),
        pincode,
        landmark || null,
        is_default || false
      ]
    );

    res.status(201).json({
      message: 'Address added successfully',
      address: result.rows[0]
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
};

const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { name, mobile_number, house_flat, street_area, city, state, pincode, landmark } = req.body;
  const userId = req.user.id;

  try {
    // Verify ownership
    const address = await pool.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (address.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Validation
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
    }

    if (mobile_number !== undefined) {
      if (!validateMobileNumber(mobile_number)) {
        return res.status(400).json({ error: 'Invalid mobile number format' });
      }
    }

    if (house_flat !== undefined) {
      if (house_flat.trim().length === 0) {
        return res.status(400).json({ error: 'House/flat number cannot be empty' });
      }
    }

    if (street_area !== undefined) {
      if (street_area.trim().length === 0) {
        return res.status(400).json({ error: 'Street/area cannot be empty' });
      }
    }

    if (city !== undefined) {
      if (city.trim().length === 0) {
        return res.status(400).json({ error: 'City cannot be empty' });
      }
    }

    if (state !== undefined) {
      if (state.trim().length === 0) {
        return res.status(400).json({ error: 'State cannot be empty' });
      }
    }

    if (pincode !== undefined) {
      if (!validatePincode(pincode)) {
        return res.status(400).json({ error: 'Invalid pincode. Must be 6 digits' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (mobile_number !== undefined) {
      updates.push(`mobile_number = $${paramCount++}`);
      values.push(mobile_number);
    }
    if (house_flat !== undefined) {
      updates.push(`house_flat = $${paramCount++}`);
      values.push(house_flat.trim());
    }
    if (street_area !== undefined) {
      updates.push(`street_area = $${paramCount++}`);
      values.push(street_area.trim());
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city.trim());
    }
    if (state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(state.trim());
    }
    if (pincode !== undefined) {
      updates.push(`pincode = $${paramCount++}`);
      values.push(pincode);
    }
    if (landmark !== undefined) {
      updates.push(`landmark = $${paramCount++}`);
      values.push(landmark);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(id);

    const query = `
      UPDATE addresses
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Address updated successfully',
      address: result.rows[0]
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
};

const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verify ownership
    const address = await pool.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (address.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Check if address is referenced in any orders
    const orderReferences = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE address_id = $1',
      [id]
    );

    if (parseInt(orderReferences.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete address that is referenced in orders'
      });
    }

    // Delete address
    await pool.query('DELETE FROM addresses WHERE id = $1', [id]);

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
};

const setDefaultAddress = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verify ownership
    const address = await pool.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (address.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Unset previous default for user
    await pool.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );

    // Set new default
    await pool.query(
      `UPDATE addresses
       SET is_default = true, updated_at = $1
       WHERE id = $2`,
      [new Date(), id]
    );

    res.json({ message: 'Default address updated successfully' });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
};

const getAddresses = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({ addresses: result.rows });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

module.exports = {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAddresses
};