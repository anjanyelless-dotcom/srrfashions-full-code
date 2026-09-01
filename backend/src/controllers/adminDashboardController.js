require('dotenv-flow/config');
const pool = require('../config/database');

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

const getDashboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') as total_customers,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) as todays_orders,
        (SELECT COALESCE(SUM(final_amount), 0)
         FROM orders
         WHERE order_status IN ('CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED')) as total_sales,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'PAYMENT_VERIFICATION_PENDING') as pending_payments,
        (SELECT COUNT(*) FROM orders WHERE order_status IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'PAYMENT_REJECTED')) as pending_orders,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
        (SELECT COUNT(DISTINCT product_id)
         FROM product_variants
         WHERE stock_quantity > 0 AND stock_quantity <= $1) as low_stock_products`,
      [LOW_STOCK_THRESHOLD]
    );

    res.json({
      dashboard: result.rows[0]
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

module.exports = {
  getDashboard
};
