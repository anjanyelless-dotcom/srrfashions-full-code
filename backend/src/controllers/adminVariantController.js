require('dotenv-flow/config');
const pool = require('../config/database');

const addVariant = async (req, res) => {
  const { id } = req.params;
  const { color, size, sku, stock_quantity } = req.body;

  if (!color || color.trim().length === 0) {
    return res.status(400).json({ error: 'Color is required' });
  }

  if (!size || size.trim().length === 0) {
    return res.status(400).json({ error: 'Size is required' });
  }

  if (!sku || sku.trim().length === 0) {
    return res.status(400).json({ error: 'SKU is required' });
  }

  if (stock_quantity === undefined || stock_quantity < 0) {
    return res.status(400).json({ error: 'Stock quantity must be 0 or greater' });
  }

  try {
    // Check if product exists
    const productExists = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    if (productExists.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check for unique SKU per product+color+size combination
    const existingVariant = await pool.query(
      `SELECT id FROM product_variants
       WHERE product_id = $1 AND color = $2 AND size = $3`,
      [id, color.trim(), size.trim()]
    );

    if (existingVariant.rows.length > 0) {
      return res.status(400).json({
        error: 'Variant with this color and size already exists for this product'
      });
    }

    // Check for SKU uniqueness across all variants
    const existingSku = await pool.query(
      'SELECT id FROM product_variants WHERE sku = $1',
      [sku.trim()]
    );

    if (existingSku.rows.length > 0) {
      return res.status(400).json({
        error: 'SKU must be unique across all products'
      });
    }

    const result = await pool.query(
      `INSERT INTO product_variants (product_id, color, size, sku, stock_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, color.trim(), size.trim(), sku.trim(), stock_quantity || 0]
    );

    res.status(201).json({
      message: 'Variant added successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Add variant error:', error);
    res.status(500).json({ error: 'Failed to add variant' });
  }
};

const updateVariant = async (req, res) => {
  const { variantId } = req.params;
  const { color, size, sku, stock_quantity } = req.body;

  try {
    // Check if variant exists
    const variantExists = await pool.query(
      'SELECT id, product_id FROM product_variants WHERE id = $1',
      [variantId]
    );
    if (variantExists.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const variant = variantExists.rows[0];

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (color !== undefined) {
      if (color.trim().length === 0) {
        return res.status(400).json({ error: 'Color cannot be empty' });
      }

      // Check for duplicate color+size combination (excluding current variant)
      if (size !== undefined) {
        const duplicateCheck = await pool.query(
          `SELECT id FROM product_variants
           WHERE product_id = $1 AND color = $2 AND size = $3 AND id != $4`,
          [variant.product_id, color.trim(), size.trim(), variantId]
        );
        if (duplicateCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'Variant with this color and size already exists for this product'
          });
        }
      }

      updates.push(`color = $${paramCount++}`);
      values.push(color.trim());
    }

    if (size !== undefined) {
      if (size.trim().length === 0) {
        return res.status(400).json({ error: 'Size cannot be empty' });
      }

      // Check for duplicate color+size combination (excluding current variant)
      if (color !== undefined) {
        const duplicateCheck = await pool.query(
          `SELECT id FROM product_variants
           WHERE product_id = $1 AND color = $2 AND size = $3 AND id != $4`,
          [variant.product_id, color.trim(), size.trim(), variantId]
        );
        if (duplicateCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'Variant with this color and size already exists for this product'
          });
        }
      }

      updates.push(`size = $${paramCount++}`);
      values.push(size.trim());
    }

    if (sku !== undefined) {
      if (sku.trim().length === 0) {
        return res.status(400).json({ error: 'SKU cannot be empty' });
      }

      // Check for SKU uniqueness (excluding current variant)
      const skuCheck = await pool.query(
        'SELECT id FROM product_variants WHERE sku = $1 AND id != $2',
        [sku.trim(), variantId]
      );
      if (skuCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'SKU must be unique across all products'
        });
      }

      updates.push(`sku = $${paramCount++}`);
      values.push(sku.trim());
    }

    if (stock_quantity !== undefined) {
      if (stock_quantity < 0) {
        return res.status(400).json({ error: 'Stock quantity must be 0 or greater' });
      }
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(stock_quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(variantId);

    const query = `
      UPDATE product_variants
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Variant updated successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
};

const deleteVariant = async (req, res) => {
  const { variantId } = req.params;

  try {
    // Check if variant exists
    const variantExists = await pool.query(
      'SELECT id FROM product_variants WHERE id = $1',
      [variantId]
    );
    if (variantExists.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Check if variant is referenced in cart_items (should handle gracefully)
    const cartReferences = await pool.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE variant_id = $1',
      [variantId]
    );

    if (parseInt(cartReferences.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete variant that is referenced in active carts'
      });
    }

    // Check if variant is referenced in order_items (should handle gracefully)
    const orderReferences = await pool.query(
      'SELECT COUNT(*) as count FROM order_items WHERE variant_id = $1',
      [variantId]
    );

    if (parseInt(orderReferences.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete variant that is referenced in orders'
      });
    }

    await pool.query('DELETE FROM product_variants WHERE id = $1', [variantId]);

    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
};

const getVariantsByProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists
    const productExists = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    if (productExists.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY color, size`,
      [id]
    );

    res.json({ variants: result.rows });
  } catch (error) {
    console.error('Get variants by product error:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
};

module.exports = {
  addVariant,
  updateVariant,
  deleteVariant,
  getVariantsByProduct
};