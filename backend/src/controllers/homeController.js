require('dotenv-flow/config');
const pool = require('../config/database');

const HOMEPAGE_LIMIT = 10;

const getHomepage = async (req, res) => {
  try {
    // Active home banners
    const homeBanners = await pool.query(
      `SELECT id, image_url, link_url, banner_type, display_order
       FROM banners
       WHERE is_active = true AND banner_type = 'HOME'
       ORDER BY display_order, created_at DESC`
    );

    // Active offer banners
    const offerBanners = await pool.query(
      `SELECT id, image_url, link_url, banner_type, display_order
       FROM banners
       WHERE is_active = true AND banner_type = 'OFFER'
       ORDER BY display_order, created_at DESC`
    );

    // Featured categories
    const featuredCategories = await pool.query(
      `SELECT id, name, image_url, display_order
       FROM categories
       WHERE is_active = true
       ORDER BY display_order, name`
    );

    // New arrivals: most recently created active products
    const newArrivalsResult = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.regular_price,
        p.selling_price,
        p.discount,
        p.created_at,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.id) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id)
      ORDER BY p.created_at DESC
      LIMIT $1`,
      [HOMEPAGE_LIMIT]
    );

    // Featured products: highest discount active products
    const featuredProductsResult = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.regular_price,
        p.selling_price,
        p.discount,
        p.created_at,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.id) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id)
      ORDER BY p.discount DESC, p.created_at DESC
      LIMIT $1`,
      [HOMEPAGE_LIMIT]
    );

    const formatProduct = (product) => ({
      ...product,
      is_in_stock: parseInt(product.total_stock) > 0,
      total_stock: parseInt(product.total_stock)
    });

    res.json({
      home_banners: homeBanners.rows,
      offer_banners: offerBanners.rows,
      featured_categories: featuredCategories.rows,
      new_arrivals: newArrivalsResult.rows.map(formatProduct),
      featured_products: featuredProductsResult.rows.map(formatProduct)
    });
  } catch (error) {
    console.error('Get homepage error:', error);
    res.status(500).json({ error: 'Failed to fetch homepage' });
  }
};

module.exports = {
  getHomepage
};
