require('dotenv-flow/config');
const pool = require('../config/database');

const buildCategoryTree = (categories, parentId = null) => {
  const tree = [];
  for (const category of categories) {
    if (category.parent_id === parentId) {
      const children = buildCategoryTree(categories, category.id);
      if (children.length > 0) {
        category.children = children;
      }
      tree.push(category);
    }
  }
  return tree;
};

const getCategories = async (req, res) => {
  try {
    // Get all active categories with product counts
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.parent_id,
        c.image_url,
        c.display_order,
        COALESCE(COUNT(DISTINCT p.id), 0) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.parent_id, c.image_url, c.display_order
      ORDER BY c.display_order, c.name
    `);

    const categories = result.rows;
    const categoryTree = buildCategoryTree(categories);

    res.json({ categories: categoryTree });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM categories WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

const getCategoryProducts = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = req.query;

  try {
    // Check if category exists and is active
    const categoryExists = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND is_active = true',
      [id]
    );
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const offset = (page - 1) * limit;

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['name', 'regular_price', 'selling_price', 'created_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get products for the category (including subcategories)
    const productsResult = await pool.query(`
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.regular_price,
        p.selling_price,
        p.discount,
        p.${sortColumn},
        c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1
        OR p.category_id IN (
          SELECT id FROM categories WHERE parent_id = $1 AND is_active = true
        )
        AND p.is_active = true
      ORDER BY p.${sortColumn} ${sortOrder}
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.category_id = $1
        OR p.category_id IN (
          SELECT id FROM categories WHERE parent_id = $1 AND is_active = true
        )
        AND p.is_active = true
    `, [id]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: productsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ error: 'Failed to fetch category products' });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryProducts
};