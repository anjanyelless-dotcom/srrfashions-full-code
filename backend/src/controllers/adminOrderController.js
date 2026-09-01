require('dotenv-flow/config');
const pool = require('../config/database');

const VALID_STATUSES = [
  'PENDING',
  'PAYMENT_VERIFICATION_PENDING',
  'PAYMENT_REJECTED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
];

const VALID_TRANSITIONS = {
  'PENDING': ['PAYMENT_VERIFICATION_PENDING', 'CANCELLED'],
  'PAYMENT_VERIFICATION_PENDING': ['PAYMENT_REJECTED', 'CONFIRMED', 'CANCELLED'],
  'PAYMENT_REJECTED': ['PAYMENT_VERIFICATION_PENDING', 'CANCELLED'],
  'CONFIRMED': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['PACKED', 'CANCELLED'],
  'PACKED': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': []
};

const isValidTransition = (currentStatus, newStatus) => {
  return VALID_TRANSITIONS[currentStatus] && VALID_TRANSITIONS[currentStatus].includes(newStatus);
};

const getAdminOrders = async (req, res) => {
  const { order_id, customer_name, mobile_number, page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (order_id) {
      conditions.push(`o.id = $${paramCount++}`);
      values.push(order_id);
    }

    if (customer_name) {
      conditions.push(`u.full_name ILIKE $${paramCount++}`);
      values.push(`%${customer_name}%`);
    }

    if (mobile_number) {
      conditions.push(`u.mobile_number = $${paramCount++}`);
      values.push(mobile_number);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.mobile_number as customer_mobile,
        a.city,
        a.state,
        a.pincode,
        p.payment_status,
        p.utr_number,
        p.screenshot_url
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN payments p ON o.id = p.order_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values.slice(0, -2));
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
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getAdminOrderDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await pool.query(
      `SELECT
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.mobile_number as customer_mobile,
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
        p.rejection_reason,
        p.verified_at,
        p.verified_by_admin_id
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN addresses a ON o.address_id = a.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1`,
      [id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [id]
    );

    res.json({
      order: order.rows[0],
      items: items.rows
    });
  } catch (error) {
    console.error('Get admin order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { order_status } = req.body;
  const adminId = req.user.id;

  if (!order_status) {
    return res.status(400).json({ error: 'order_status is required' });
  }

  if (!VALID_STATUSES.includes(order_status)) {
    return res.status(400).json({
      error: 'Invalid order status',
      valid_statuses: VALID_STATUSES
    });
  }

  try {
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = order.rows[0].order_status;

    if (!isValidTransition(currentStatus, order_status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        current_status: currentStatus,
        requested_status: order_status,
        allowed_transitions: VALID_TRANSITIONS[currentStatus]
      });
    }

    await pool.query(
      `UPDATE orders
       SET order_status = $1, updated_at = $2
       WHERE id = $3`,
      [order_status, new Date(), id]
    );

    res.json({
      message: 'Order status updated successfully',
      order: {
        id,
        previous_status: currentStatus,
        order_status,
        updated_by: adminId
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

const cancelAdminOrder = async (req, res) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;
  const adminId = req.user.id;

  if (!cancellation_reason || cancellation_reason.trim().length === 0) {
    return res.status(400).json({ error: 'Cancellation reason is required' });
  }

  try {
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = order.rows[0].order_status;

    if (currentStatus === 'CANCELLED' || currentStatus === 'DELIVERED') {
      return res.status(400).json({
        error: 'Order cannot be cancelled',
        current_status: currentStatus
      });
    }

    await pool.query('BEGIN');

    try {
      // If stock was reduced (Confirmed or later), restock
      const postConfirmationStatuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED'];

      if (postConfirmationStatuses.includes(currentStatus)) {
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
         SET order_status = 'CANCELLED', updated_at = $1
         WHERE id = $2`,
        [new Date(), id]
      );

      // Update payment status if exists
      await pool.query(
        `UPDATE payments
         SET payment_status = 'CANCELLED'
         WHERE order_id = $1`,
        [id]
      );

      await pool.query('COMMIT');

      res.json({
        message: 'Order cancelled successfully',
        order: {
          id,
          order_status: 'CANCELLED',
          cancellation_reason: cancellation_reason.trim(),
          cancelled_by: adminId
        }
      });
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Cancel admin order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

module.exports = {
  getAdminOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  cancelAdminOrder,
  VALID_STATUSES,
  VALID_TRANSITIONS
};