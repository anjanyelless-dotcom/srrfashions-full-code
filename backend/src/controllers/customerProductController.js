require('dotenv-flow/config');
const pool = require('../config/database');

const getProducts = async (req, res) => {
  const {
    category_id,
    min_price,
    max_price,
    size,
    color,
    sort = 'newest',
    search,
    page = 1,
    limit = 20
  } = req.query;

  try {
    console.log('[DEBUG] getProducts called with params:', { category_id, sort, page, limit });
    const offset = (page - 1) * limit;
    console.log('[DEBUG] Offset calculated:', offset);

    // Build WHERE conditions
    const conditions = ['p.is_active = true'];
    const values = [];
    let paramCount = 1;

    // Category filter
    if (category_id) {
      conditions.push(`p.category_id = $${paramCount++}`);
      values.push(category_id);
    }

    // Price range filters
    if (min_price) {
      conditions.push(`p.selling_price >= $${paramCount++}`);
      values.push(parseFloat(min_price));
    }

    if (max_price) {
      conditions.push(`p.selling_price <= $${paramCount++}`);
      values.push(parseFloat(max_price));
    }

    // Search filter (case-insensitive)
    if (search) {
      conditions.push(`(p.name ILIKE $${paramCount++} OR p.description ILIKE $${paramCount++})`);
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm);
    }

    // Size and color filters (need to join with variants)
    const joinVariants = size || color;
    if (size) {
      conditions.push(`pv.size = $${paramCount++}`);
      values.push(size);
    }

    if (color) {
      conditions.push(`pv.color = $${paramCount++}`);
      values.push(color);
    }

    // Build the query
    let query = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.regular_price,
        p.selling_price,
        p.discount,
        p.created_at,
        c.name as category_name,
        c.id as category_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    if (joinVariants) {
      query += ` LEFT JOIN product_variants pv ON p.id = pv.product_id`;
    }

    query += ` WHERE ${conditions.join(' AND ')}`;

    // Only include products that have at least one variant (business rule)
    query += ` AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id)`;

    // Sorting - must include sort column in SELECT when using DISTINCT
    let sortColumn = 'p.created_at';
    let sortOrder = 'DESC';

    switch (sort) {
      case 'price_low_high':
        sortColumn = 'p.selling_price';
        sortOrder = 'ASC';
        break;
      case 'price_high_low':
        sortColumn = 'p.selling_price';
        sortOrder = 'DESC';
        break;
      case 'newest':
      default:
        sortColumn = 'p.created_at';
        sortOrder = 'DESC';
        break;
    }

    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    console.log('[DEBUG] Executing main query with', values.length, 'parameters');
    const result = await pool.query(query, values);
    console.log('[DEBUG] Main query returned', result.rows.length, 'products');

    // Get additional data for each product (images, variants, colors, sizes)
    const products = await Promise.all(result.rows.map(async (product) => {
      // Get product images
      const imagesResult = await pool.query(
        `SELECT id, image_url, display_order
         FROM product_images
         WHERE product_id = $1
         ORDER BY display_order`,
        [product.id]
      );

      // Get product variants
      const variantsResult = await pool.query(
        `SELECT id, color, size, sku, stock_quantity,
                CASE WHEN stock_quantity > 0 THEN true ELSE false END as available
         FROM product_variants
         WHERE product_id = $1
         ORDER BY color, size`,
        [product.id]
      );

      // Get available colors and sizes
      const colorsResult = await pool.query(
        `SELECT DISTINCT color
         FROM product_variants
         WHERE product_id = $1
           AND stock_quantity > 0
         ORDER BY color`,
        [product.id]
      );

      const sizesResult = await pool.query(
        `SELECT DISTINCT size
         FROM product_variants
         WHERE product_id = $1
           AND stock_quantity > 0
         ORDER BY size`,
        [product.id]
      );

      return {
        ...product,
        images: imagesResult.rows,
        variants: variantsResult.rows,
        available_colors: colorsResult.rows.map(row => row.color),
        available_sizes: sizesResult.rows.map(row => row.size)
      };
    }));

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
    `;

    const countValues = [];

    if (joinVariants) {
      countQuery += ` LEFT JOIN product_variants pv ON p.id = pv.product_id`;
    }

    // Build count conditions separately
    const countConditions = ['p.is_active = true'];
    let countParamCount = 1;

    if (category_id) {
      countConditions.push(`p.category_id = $${countParamCount++}`);
      countValues.push(category_id);
    }

    if (min_price) {
      countConditions.push(`p.selling_price >= $${countParamCount++}`);
      countValues.push(parseFloat(min_price));
    }

    if (max_price) {
      countConditions.push(`p.selling_price <= $${countParamCount++}`);
      countValues.push(parseFloat(max_price));
    }

    if (search) {
      countConditions.push(`(p.name ILIKE $${countParamCount++} OR p.description ILIKE $${countParamCount++})`);
      const searchTerm = `%${search}%`;
      countValues.push(searchTerm, searchTerm);
    }

    if (size) {
      countConditions.push(`pv.size = $${countParamCount++}`);
      countValues.push(size);
    }

    if (color) {
      countConditions.push(`pv.color = $${countParamCount++}`);
      countValues.push(color);
    }

    countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    countQuery += ` AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id)`;

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[ERROR] Get products failed:', error.message);
    console.error('[ERROR] Stack trace:', error.stack);
    console.error('[ERROR] Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // Get product details
    const productResult = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Get product images
    const imagesResult = await pool.query(
      `SELECT id, image_url, display_order
       FROM product_images
       WHERE product_id = $1
       ORDER BY display_order`,
      [id]
    );

    // Get product variants with stock status
    const variantsResult = await pool.query(
      `SELECT id, color, size, sku, stock_quantity,
              CASE WHEN stock_quantity > 0 THEN true ELSE false END as available
       FROM product_variants
       WHERE product_id = $1
       ORDER BY color, size`,
      [id]
    );

    // Get available colors and sizes
    const colorsResult = await pool.query(
      `SELECT DISTINCT color
       FROM product_variants
       WHERE product_id = $1
         AND stock_quantity > 0
       ORDER BY color`,
      [id]
    );

    const sizesResult = await pool.query(
      `SELECT DISTINCT size
       FROM product_variants
       WHERE product_id = $1
         AND stock_quantity > 0
       ORDER BY size`,
      [id]
    );

    // Get total stock across all variants
    const stockResult = await pool.query(
      `SELECT SUM(stock_quantity) as total_stock
       FROM product_variants
       WHERE product_id = $1`,
      [id]
    );

    const totalStock = parseInt(stockResult.rows[0].total_stock) || 0;
    const hasStock = totalStock > 0;

    res.json({
      product: {
        ...product,
        has_stock: hasStock,
        total_stock: totalStock
      },
      images: imagesResult.rows,
      variants: variantsResult.rows,
      available_colors: colorsResult.rows.map(row => row.color),
      available_sizes: sizesResult.rows.map(row => row.size)
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

module.exports = {
  getProducts,
  getProductById
};