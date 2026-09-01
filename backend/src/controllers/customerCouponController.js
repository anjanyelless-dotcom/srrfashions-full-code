require('dotenv-flow/config');
const pool = require('../config/database');

const getOrCreateCart = async (userId) => {
  let cart = await pool.query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (cart.rows.length === 0) {
    cart = await pool.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
  }

  return cart.rows[0].id;
};

const calculateCartSubtotal = async (cartId) => {
  const result = await pool.query(
    `SELECT SUM(ci.quantity * p.selling_price) as subtotal
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1`,
    [cartId]
  );

  return parseFloat(result.rows[0].subtotal) || 0;
};

const applyCoupon = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code || code.trim().length === 0) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  try {
    // Get or create cart
    const cartId = await getOrCreateCart(userId);

    // Calculate cart subtotal
    const cartSubtotal = await calculateCartSubtotal(cartId);

    // Check if cart has items
    const cartItems = await pool.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1',
      [cartId]
    );

    if (parseInt(cartItems.rows[0].count) === 0) {
      return res.status(400).json({ error: 'Cart is empty. Cannot apply coupon' });
    }

    // Get coupon details
    const coupon = await pool.query(
      `SELECT * FROM coupons WHERE code = $1`,
      [code.trim().toUpperCase()]
    );

    if (coupon.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const couponData = coupon.rows[0];

    // Check if coupon is active
    if (!couponData.is_active) {
      return res.status(400).json({ error: 'Coupon is not active' });
    }

    // Check if coupon is within validity period
    const now = new Date();
    const startDate = new Date(couponData.start_date);
    const expiryDate = new Date(couponData.expiry_date);

    if (now < startDate) {
      return res.status(400).json({ error: 'Coupon is not yet valid' });
    }

    if (now > expiryDate) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check minimum order requirement
    if (cartSubtotal < parseFloat(couponData.minimum_order)) {
      return res.status(400).json({
        error: 'Minimum order value not met',
        minimum_order: couponData.minimum_order,
        cart_subtotal: cartSubtotal
      });
    }

    // Check total usage limit
    if (couponData.total_usage_limit !== null) {
      const totalUsage = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = $1',
        [couponData.id]
      );

      if (parseInt(totalUsage.rows[0].count) >= couponData.total_usage_limit) {
        return res.status(400).json({
          error: 'Coupon usage limit has been reached'
        });
      }
    }

    // Check per-customer usage limit
    if (couponData.usage_limit_per_customer !== null) {
      const customerUsage = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
        [couponData.id, userId]
      );

      if (parseInt(customerUsage.rows[0].count) >= couponData.usage_limit_per_customer) {
        return res.status(400).json({
          error: 'You have already used this coupon the maximum number of times'
        });
      }
    }

    // Calculate discount
    let discount = 0;

    if (couponData.discount_type === 'FLAT') {
      discount = parseFloat(couponData.discount_value);
    } else if (couponData.discount_type === 'PERCENT') {
      discount = (cartSubtotal * parseFloat(couponData.discount_value)) / 100;
    }

    // Apply maximum discount cap
    if (couponData.maximum_discount !== null && discount > parseFloat(couponData.maximum_discount)) {
      discount = parseFloat(couponData.maximum_discount);
    }

    // Ensure discount doesn't exceed cart subtotal
    if (discount > cartSubtotal) {
      discount = cartSubtotal;
    }

    // Store coupon in cart (we'll add coupon_id to carts table for this)
    // For now, we'll return the coupon details and discount
    // In a real implementation, you might want to store the applied coupon in the cart

    res.json({
      message: 'Coupon applied successfully',
      coupon: {
        id: couponData.id,
        code: couponData.code,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        discount: parseFloat(discount.toFixed(2)),
        cart_subtotal: parseFloat(cartSubtotal.toFixed(2)),
        new_total: parseFloat((cartSubtotal - discount).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
};

const removeCoupon = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's cart
    const cart = await pool.query(
      'SELECT id FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length === 0) {
      return res.json({ message: 'No coupon applied to remove' });
    }

    // In a real implementation, you would remove the applied coupon from the cart
    // For now, we'll just return a success message
    // The cart system would need to be extended to store applied coupons

    res.json({ message: 'Coupon removed successfully' });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({ error: 'Failed to remove coupon' });
  }
};

const getAvailableCoupons = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get or create cart
    const cartId = await getOrCreateCart(userId);

    // Calculate cart subtotal
    const cartSubtotal = await calculateCartSubtotal(cartId);

    // Get available coupons for the user
    const now = new Date();

    const result = await pool.query(
      `SELECT c.*,
              COALESCE(COUNT(cu.id) FILTER (WHERE cu.user_id = $1), 0) as user_usage_count
       FROM coupons c
       LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
       WHERE c.is_active = true
       GROUP BY c.id
       HAVING c.start_date <= $2 AND c.expiry_date >= $2
       ORDER BY c.created_at DESC`,
      [userId, now]
    );

    // Filter coupons based on usage limits and minimum order
    const availableCoupons = result.rows.filter(coupon => {
      // Check total usage limit
      if (coupon.total_usage_limit && coupon.total_usage_count >= coupon.total_usage_limit) {
        return false;
      }

      // Check per-customer usage limit
      if (coupon.usage_limit_per_customer && coupon.user_usage_count >= coupon.usage_limit_per_customer) {
        return false;
      }

      // Check minimum order
      if (cartSubtotal < parseFloat(coupon.minimum_order)) {
        return false;
      }

      return true;
    });

    // Calculate discount for each available coupon
    const couponsWithDiscount = availableCoupons.map(coupon => {
      let discount = 0;

      if (coupon.discount_type === 'FLAT') {
        discount = parseFloat(coupon.discount_value);
      } else if (coupon.discount_type === 'PERCENT') {
        discount = (cartSubtotal * parseFloat(coupon.discount_value)) / 100;
      }

      // Apply maximum discount cap
      if (coupon.maximum_discount && discount > parseFloat(coupon.maximum_discount)) {
        discount = parseFloat(coupon.maximum_discount);
      }

      // Ensure discount doesn't exceed cart subtotal
      if (discount > cartSubtotal) {
        discount = cartSubtotal;
      }

      return {
        ...coupon,
        discount: parseFloat(discount.toFixed(2)),
        applicable: true
      };
    });

    res.json({
      cart_subtotal: parseFloat(cartSubtotal.toFixed(2)),
      available_coupons: couponsWithDiscount
    });
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch available coupons' });
  }
};

module.exports = {
  applyCoupon,
  removeCoupon,
  getAvailableCoupons
};