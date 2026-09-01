require('dotenv-flow/config');
const pool = require('../config/database');

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

const getInventory = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  try {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramCount} OR pv.sku ILIKE $${paramCount} OR pv.color ILIKE $${paramCount} OR pv.size ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.is_active as product_is_active,
        c.name as category_name,
        pv.id as variant_id,
        pv.color,
        pv.size,
        pv.sku,
        pv.stock_quantity,
        pv.created_at,
        pv.updated_at
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.id, pv.color, pv.size
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      low_stock_threshold: LOW_STOCK_THRESHOLD,
      inventory: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

const updateVariantStock = async (req, res) => {
  const { variantId } = req.params;
  const { stock_quantity, change_reason } = req.body;
  const adminId = req.user.id;

  if (stock_quantity === undefined || stock_quantity === null) {
    return res.status(400).json({ error: 'stock_quantity is required' });
  }

  const newStock = parseInt(stock_quantity);
  if (isNaN(newStock) || newStock < 0) {
    return res.status(400).json({ error: 'stock_quantity must be a non-negative integer' });
  }

  try {
    const variantResult = await pool.query(
      'SELECT * FROM product_variants WHERE id = $1',
      [variantId]
    );

    if (variantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const variant = variantResult.rows[0];
    const oldStock = parseInt(variant.stock_quantity);

    await pool.query('BEGIN');

    try {
      const updatedVariant = await pool.query(
        `UPDATE product_variants
         SET stock_quantity = $1, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [newStock, new Date(), variantId]
      );

      await pool.query(
        `INSERT INTO inventory_stock_logs
         (variant_id, product_id, old_stock, new_stock, changed_by_admin_id, change_reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [variantId, variant.product_id, oldStock, newStock, adminId, change_reason || null]
      );

      await pool.query('COMMIT');

      res.json({
        message: 'Stock updated successfully',
        variant: updatedVariant.rows[0],
        log: {
          old_stock: oldStock,
          new_stock: newStock,
          changed_by_admin_id: adminId,
          change_reason: change_reason || null
        }
      });
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Update variant stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

const getLowStock = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.is_active as product_is_active,
        c.name as category_name,
        pv.id as variant_id,
        pv.color,
        pv.size,
        pv.sku,
        pv.stock_quantity
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pv.stock_quantity > 0 AND pv.stock_quantity <= $1
      ORDER BY pv.stock_quantity ASC, p.id
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [LOW_STOCK_THRESHOLD, limit, offset]);

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM product_variants
       WHERE stock_quantity > 0 AND stock_quantity <= $1`,
      [LOW_STOCK_THRESHOLD]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      low_stock_threshold: LOW_STOCK_THRESHOLD,
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

const getOutOfStock = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.is_active as product_is_active,
        c.name as category_name,
        pv.id as variant_id,
        pv.color,
        pv.size,
        pv.sku,
        pv.stock_quantity
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pv.stock_quantity = 0
      ORDER BY p.id, pv.color, pv.size
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM product_variants
       WHERE stock_quantity = 0`
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get out of stock error:', error);
    res.status(500).json({ error: 'Failed to fetch out of stock items' });
  }
};

module.exports = {
  getInventory,
  updateVariantStock,
  getLowStock,
  getOutOfStock
};
