require('dotenv-flow/config');
const pool = require('../config/database');
const { deleteFile, getFileUrl } = require('../storage/storageAdapter');

const createCategory = async (req, res) => {
  const { name, parent_id, image_url, display_order } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Check if parent exists (if parent_id is provided)
    if (parent_id) {
      const parentExists = await pool.query(
        'SELECT id FROM categories WHERE id = $1',
        [parent_id]
      );
      if (parentExists.rows.length === 0) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO categories (name, parent_id, image_url, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), parent_id || null, image_url || null, display_order || 0]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, image_url, display_order } = req.body;

  try {
    // Check if category exists
    const categoryExists = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if parent exists (if parent_id is provided and different from current id)
    if (parent_id && parent_id !== parseInt(id)) {
      const parentExists = await pool.query(
        'SELECT id FROM categories WHERE id = $1',
        [parent_id]
      );
      if (parentExists.rows.length === 0) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (parent_id !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(parent_id || null);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(display_order);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(id);

    const query = `
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if category exists
    const categoryExists = await pool.query(
      'SELECT id, image_url FROM categories WHERE id = $1',
      [id]
    );
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has products
    const hasProducts = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );
    if (parseInt(hasProducts.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with products. Please reassign or delete products first.'
      });
    }

    // Check if category has child categories
    const hasChildren = await pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [id]
    );
    if (parseInt(hasChildren.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with child categories. Please reassign or delete child categories first.'
      });
    }

    // Delete category image if exists
    const category = categoryExists.rows[0];
    if (category.image_url) {
      const imagePath = category.image_url.replace('/uploads/', '');
      await deleteFile(imagePath);
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

const updateCategoryStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active status is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE categories
       SET is_active = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [is_active, new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category status updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category status error:', error);
    res.status(500).json({ error: 'Failed to update category status' });
  }
};

const uploadCategoryImage = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    // Check if category exists
    const categoryExists = await pool.query(
      'SELECT id, image_url FROM categories WHERE id = $1',
      [id]
    );
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete old image if exists
    const category = categoryExists.rows[0];
    if (category.image_url) {
      const oldImagePath = category.image_url.replace('/uploads/', '');
      await deleteFile(oldImagePath);
    }

    // Generate new image URL
    const imageUrl = getFileUrl(req.file.filename, 'categories');

    // Update category with new image URL
    const result = await pool.query(
      `UPDATE categories
       SET image_url = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [imageUrl, new Date(), id]
    );

    res.json({
      message: 'Category image uploaded successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Upload category image error:', error);
    res.status(500).json({ error: 'Failed to upload category image' });
  }
};

const updateCategoryOrder = async (req, res) => {
  const { id } = req.params;
  const { display_order } = req.body;

  if (display_order === undefined || display_order < 0) {
    return res.status(400).json({ error: 'Valid display_order is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE categories
       SET display_order = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [display_order, new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category order updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category order error:', error);
    res.status(500).json({ error: 'Failed to update category order' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM categories ORDER BY display_order, name`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  uploadCategoryImage,
  updateCategoryOrder,
  getAllCategories
};