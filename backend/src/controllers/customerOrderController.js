require('dotenv-flow/config');
const pool = require('../config/database');

const getCustomerOrders = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT
        o.*,
        a.name as address_name,
        a.mobile_number as address_mobile,
        a.house_flat,
        a.street_area,
        a.city,
        a.state,
        a.pincode,
        a.landmark,
        p.payment_status,
        p.utr_number,
        p.screenshot_url
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getCustomerOrderDetail = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Get order details
    const order = await pool.query(
      `SELECT
        o.*,
        a.name as address_name,
        a.mobile_number as address_mobile,
        a.house_flat,
        a.street_area,
        a.city,
        a.state,
        a.pincode,
        a.landmark,
        p.payment_status,
        p.utr_number,
        p.screenshot_url,
        p.payment_session_id,
        p.cashfree_order_id,
        p.rejection_reason,
        p.verified_at,
        p.verified_by_admin_id
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [id]
    );

    res.json({
      order: order.rows[0],
      items: items.rows
    });
  } catch (error) {
    console.error('Get customer order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

const cancelCustomerOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Get order with ownership check
    const order = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = order.rows[0].order_status;

    // Allowed customer cancellation statuses
    const cancellableStatuses = ['PENDING', 'PAYMENT_VERIFICATION_PENDING', 'PAYMENT_REJECTED', 'CONFIRMED'];

    if (!cancellableStatuses.includes(currentStatus)) {
      return res.status(400).json({
        error: 'Order cannot be cancelled by customer at this stage',
        current_status: currentStatus
      });
    }

    await pool.query('BEGIN');

    try {
      // If stock was reduced (Confirmed or later), restock
      if (currentStatus === 'CONFIRMED') {
        const orderItems = await pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [id]
        );

        for (const item of orderItems.rows) {
          await pool.query(
            `UPDATE product_variants
             SET stock_quantity = stock_quantity + $1
             WHERE id = $2`,
            [item.quantity, item.variant_id]
          );
        }
      }

      // Update order status to Cancelled
      await pool.query(
        `UPDATE orders
         SET order_status = 'CANCELLED'
         WHERE id = $1`,
        [id]
      );

      // Update payment status if exists
      await pool.query(
        `UPDATE payments
         SET payment_status = 'CANCELLED'
         WHERE order_id = $1`,
        [id]
      );

      await pool.query('COMMIT');

      res.json({ message: 'Order cancelled successfully' });
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Cancel customer order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

const getPaymentStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // First verify the order belongs to this user
    const orderCheck = await pool.query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Call the central sync function — this queries Cashfree server-side
    // (both Get Order API and Get Payments API) and updates the DB.
    const { syncCashfreePaymentStatus } = require('./cashfreeController');
    const syncResult = await syncCashfreePaymentStatus(Number(id));

    // Read the now-updated payment + order record
    const paymentResult = await pool.query(
      `SELECT p.*, o.order_number, o.order_status, o.final_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.order_id = $1`,
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    res.json({
      order_id: Number(id),
      order_number: payment.order_number,
      order_status: payment.order_status,
      payment_status: payment.payment_status,
      cf_order_status: payment.cf_order_status,
      final_amount: payment.final_amount,
      cashfree_order_id: payment.cashfree_order_id,
      cashfree_payment_id: payment.cashfree_payment_id,
      payment_session_id: payment.payment_session_id,
      synced: syncResult.synced || false
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment status' });
  }
};

module.exports = {
  getCustomerOrders,
  getCustomerOrderDetail,
  cancelCustomerOrder,
  getPaymentStatus
};