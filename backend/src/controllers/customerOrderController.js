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
    // Get order with ownership check
    const order = await pool.query(
      `SELECT o.*, p.payment_status, p.cf_order_status, p.cashfree_order_id, p.payment_session_id
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = order.rows[0];

    // If payment has Cashfree order ID and is not paid, verify with Cashfree
    if (orderData.cashfree_order_id && orderData.payment_status !== 'PAID') {
      try {
        const { verifyPaymentStatus, processSuccessfulPayment } = require('./cashfreeController');
        const cashfreeOrder = await verifyPaymentStatus(orderData.cashfree_order_id);

        // Update local status based on Cashfree status
        if (cashfreeOrder.order_status === 'PAID' || cashfreeOrder.order_status === 'SUCCESS') {
          if (orderData.payment_status !== 'PAID') {
            await processSuccessfulPayment(orderData.id, cashfreeOrder.cf_payment_id || cashfreeOrder.payment_id);
            orderData.payment_status = 'PAID';
            orderData.cf_order_status = 'SUCCESS';
          }
        } else if (cashfreeOrder.order_status === 'FAILED' || cashfreeOrder.order_status === 'CANCELLED') {
          await pool.query(
            `UPDATE payments
             SET payment_status = 'FAILED',
                 cf_order_status = $1,
                 updated_at = NOW()
             WHERE order_id = $2`,
            [cashfreeOrder.order_status, id]
          );
          orderData.payment_status = 'FAILED';
          orderData.cf_order_status = cashfreeOrder.order_status;
        } else {
          orderData.cf_order_status = cashfreeOrder.order_status;
        }
      } catch (verifyError) {
        console.error('Error verifying payment with Cashfree:', verifyError);
        // Return local status if verification fails
      }
    }

    res.json({
      order_id: id,
      order_number: orderData.order_number,
      order_status: orderData.order_status,
      payment_status: orderData.payment_status,
      cf_order_status: orderData.cf_order_status,
      final_amount: orderData.final_amount,
      cashfree_order_id: orderData.cashfree_order_id,
      payment_session_id: orderData.payment_session_id
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