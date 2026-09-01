require('dotenv-flow/config');
const pool = require('../config/database');
const { qualifyReferral } = require('../controllers/adminReferralTrackingController');

const getPendingPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        p.id as payment_id,
        p.order_id,
        p.amount,
        p.payment_method,
        p.utr_number,
        p.screenshot_url,
        p.payment_status,
        p.created_at as payment_date,
        o.order_number,
        o.user_id,
        u.full_name as customer_name,
        u.email as customer_email,
        u.mobile_number as customer_mobile,
        o.final_amount as order_amount,
        o.coupon_discount,
        o.referral_discount,
        o.shipping_fee
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE p.payment_status = 'PAYMENT_VERIFICATION_PENDING'
       ORDER BY p.created_at ASC`
    );

    res.json({ pending_payments: result.rows });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
};

const approvePayment = async (req, res) => {
  const { paymentId } = req.params;
  const adminId = req.user.id;

  let client;

  try {
    // Get payment details
    const payment = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = payment.rows[0];

    if (paymentData.payment_status !== 'PAYMENT_VERIFICATION_PENDING') {
      return res.status(400).json({ error: 'Payment is not in verification pending status' });
    }

    // Get order details
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [paymentData.order_id]
    );

    const orderData = order.rows[0];

    client = await pool.connect();

    // Start transaction for atomic stock reduction
    await client.query('BEGIN');

    try {
      // Get order items for stock reduction
      const orderItems = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [paymentData.order_id]
      );

      // Reduce stock for each order item
      for (const item of orderItems.rows) {
        const stockUpdate = await client.query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity - $1
           WHERE id = $2 AND stock_quantity >= $1
           RETURNING stock_quantity`,
          [item.quantity, item.variant_id]
        );

        if (stockUpdate.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({
            error: 'Insufficient stock for one or more items',
            item: {
              product_name: item.product_name,
              variant_id: item.variant_id,
              requested_quantity: item.quantity
            }
          });
        }
      }

      // Update payment status to PAID
      await client.query(
        `UPDATE payments
         SET payment_status = 'PAID',
             verified_by_admin_id = $1,
             verified_at = $2
         WHERE id = $3`,
        [adminId, new Date(), paymentId]
      );

      const updatedPayment = await client.query(
        'SELECT payment_status FROM payments WHERE id = $1',
        [paymentId]
      );
      console.log('DEBUG payment status inside transaction:', updatedPayment.rows[0]);

      // Update order status to CONFIRMED
      await client.query(
        `UPDATE orders
         SET order_status = 'CONFIRMED'
         WHERE id = $1`,
        [paymentData.order_id]
      );

      // Finalize coupon usage if coupon was used
      if (orderData.coupon_id) {
        await client.query(
          `INSERT INTO coupon_usages (coupon_id, user_id, order_id)
           VALUES ($1, $2, $3)`,
          [orderData.coupon_id, orderData.user_id, paymentData.order_id]
        );
      }

      // Finalize referral reward usage if referral reward was used
      if (orderData.referral_discount > 0) {
        await client.query(
          `UPDATE referral_rewards
           SET is_used = true, order_id_used_on = $1
           WHERE user_id = $2 AND is_used = false
           ORDER BY created_at ASC
           LIMIT 1`,
          [paymentData.order_id, orderData.user_id]
        );
      }

      await client.query('COMMIT');
      client.release();

      // Trigger referral qualification logic after successful commit
      if (orderData.referral_discount === 0) {
        const referralResult = await qualifyReferral(orderData.user_id, paymentData.order_id, orderData.final_amount);
        if (referralResult.success) {
          console.log('Referral qualified:', referralResult);
        }
      }

      res.json({
        message: 'Payment approved successfully',
        payment: {
          id: paymentId,
          payment_status: 'PAID',
          verified_by_admin_id: adminId,
          verified_at: new Date()
        },
        order: {
          id: orderData.id,
          order_number: orderData.order_number,
          order_status: 'CONFIRMED'
        }
      });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      client.release();
      throw transactionError;
    }
  } catch (error) {
    console.error('Approve payment error:', error);
    if (client) client.release();
    res.status(500).json({ error: 'Failed to approve payment' });
  }
};

const rejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { rejection_reason } = req.body;
  const adminId = req.user.id;

  if (!rejection_reason || rejection_reason.trim().length === 0) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  let client;

  try {
    // Get payment details
    const payment = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = payment.rows[0];

    if (paymentData.payment_status !== 'PAYMENT_VERIFICATION_PENDING') {
      return res.status(400).json({ error: 'Payment is not in verification pending status' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    try {
      // Update payment status to REJECTED
      await client.query(
        `UPDATE payments
         SET payment_status = 'REJECTED',
             rejection_reason = $1,
             verified_by_admin_id = $2,
             verified_at = $3
         WHERE id = $4`,
        [rejection_reason.trim(), adminId, new Date(), paymentId]
      );

      // Update order status to PAYMENT REJECTED
      await client.query(
        `UPDATE orders
         SET order_status = 'PAYMENT_REJECTED'
         WHERE id = $1`,
        [paymentData.order_id]
      );

      await client.query('COMMIT');
      client.release();

      res.json({
        message: 'Payment rejected successfully',
        payment: {
          id: paymentId,
          payment_status: 'REJECTED',
          rejection_reason: rejection_reason.trim(),
          verified_by_admin_id: adminId,
          verified_at: new Date()
        },
        order: {
          id: paymentData.order_id,
          order_status: 'PAYMENT_REJECTED'
        }
      });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      client.release();
      throw transactionError;
    }
  } catch (error) {
    console.error('Reject payment error:', error);
    if (client) client.release();
    res.status(500).json({ error: 'Failed to reject payment' });
  }
};

module.exports = {
  getPendingPayments,
  approvePayment,
  rejectPayment
};
