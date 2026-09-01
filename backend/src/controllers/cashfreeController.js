require('dotenv-flow/config');
const pool = require('../config/database');

const verifyPaymentStatus = async (orderId) => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const apiVersion = process.env.CASHFREE_API_VERSION;
  const baseUrl = process.env.CASHFREE_BASE_URL;

  const missingVars = [];
  if (!clientId) missingVars.push('CASHFREE_CLIENT_ID');
  if (!clientSecret) missingVars.push('CASHFREE_CLIENT_SECRET');
  if (!baseUrl) missingVars.push('CASHFREE_BASE_URL');

  if (missingVars.length > 0) {
    console.error('Cashfree configuration missing:', missingVars.join(', '));
    throw new Error(`Cashfree payment gateway not configured. Missing: ${missingVars.join(', ')}`);
  }

  try {
    const url = `${baseUrl}/pg/orders/${encodeURIComponent(orderId)}`;
    const headers = {
      'x-api-version': apiVersion || '2026-01-01',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Cashfree payment verification failed: ${response.status}`, responseData);
      throw new Error('Failed to verify payment with Cashfree');
    }

    return responseData;
  } catch (error) {
    console.error(`Cashfree payment verification error for ${orderId}:`, error.message);
    throw error;
  }
};

const processSuccessfulPayment = async (paymentId, cashfreePaymentId) => {
  try {
    await pool.query('BEGIN');

    // Get payment and order details
    const paymentResult = await pool.query(
      `SELECT p.*, o.user_id, o.final_amount, o.order_number
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = paymentResult.rows[0];

    // Check if already processed
    if (payment.payment_status === 'PAID') {
      await pool.query('ROLLBACK');
      return { alreadyProcessed: true };
    }

    // Update payment status
    await pool.query(
      `UPDATE payments
       SET payment_status = 'PAID',
           cashfree_payment_id = $1,
           cf_order_status = 'SUCCESS',
           updated_at = NOW()
       WHERE id = $2`,
      [cashfreePaymentId, paymentId]
    );

    // Update order status
    await pool.query(
      `UPDATE orders
       SET order_status = 'PAID',
           updated_at = NOW()
       WHERE id = $1`,
      [payment.order_id]
    );

    // Deduct inventory
    const orderItems = await pool.query(
      'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1',
      [payment.order_id]
    );

    for (const item of orderItems.rows) {
      await pool.query(
        `UPDATE product_variants
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2`,
        [item.quantity, item.variant_id]
      );
    }

    // Clear user's cart
    await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)`,
      [payment.user_id]
    );

    await pool.query('COMMIT');

    console.log(`Payment processed successfully: payment_id=${paymentId}, order_number=${payment.order_number}`);

    return { success: true, orderNumber: payment.order_number };
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error processing successful payment:', error);
    throw error;
  }
};

const getOrder = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const sanitizedOrderId = orderId.trim();

  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const apiVersion = process.env.CASHFREE_API_VERSION;
  const baseUrl = process.env.CASHFREE_BASE_URL;

  if (!clientId) {
    console.error('Cashfree Get Order failed: CASHFREE_CLIENT_ID not configured');
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  if (!clientSecret) {
    console.error('Cashfree Get Order failed: CASHFREE_CLIENT_SECRET not configured');
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  if (!baseUrl) {
    console.error('Cashfree Get Order failed: CASHFREE_BASE_URL not configured');
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  console.log(`Cashfree Get Order request started: ${sanitizedOrderId}`);

  try {
    const url = `${baseUrl}/pg/orders/${encodeURIComponent(sanitizedOrderId)}`;
    const headers = {
      'x-api-version': apiVersion || '2026-01-01',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Cashfree Get Order failed: ${response.status}`, responseData);

      if (response.status === 400) {
        return res.status(400).json({ error: 'Invalid order ID or request' });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(500).json({ error: 'Payment gateway authentication failed' });
      }
      if (response.status === 404) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (response.status >= 500) {
        return res.status(502).json({ error: 'Payment gateway service unavailable' });
      }

      return res.status(502).json({ error: 'Payment gateway error' });
    }

    console.log(`Cashfree Get Order successful: ${sanitizedOrderId}`);

    const safeResponse = {
      ...responseData,
      customer_details: responseData.customer_details ? {
        customer_id: responseData.customer_details.customer_id,
        customer_name: responseData.customer_details.customer_name,
        customer_email: responseData.customer_details.customer_email,
        customer_phone: responseData.customer_details.customer_phone
      } : null
    };

    res.json(safeResponse);
  } catch (error) {
    console.error(`Cashfree Get Order error for ${sanitizedOrderId}:`, error.message);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return res.status(502).json({ error: 'Unable to connect to payment gateway' });
    }

    res.status(500).json({ error: 'Failed to retrieve order status' });
  }
};

const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId || isNaN(orderId)) {
    return res.status(400).json({ error: 'Valid order ID is required' });
  }

  try {
    // Get payment details from database
    const paymentResult = await pool.query(
      `SELECT p.*, o.order_number, o.order_status, o.final_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.order_id = $1`,
      [orderId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // If payment has Cashfree order ID, verify with Cashfree
    if (payment.cashfree_order_id && payment.payment_status !== 'PAID') {
      try {
        const cashfreeOrder = await verifyPaymentStatus(payment.cashfree_order_id);

        // Update local status based on Cashfree status
        if (cashfreeOrder.order_status === 'PAID' || cashfreeOrder.order_status === 'SUCCESS') {
          if (payment.payment_status !== 'PAID') {
            await processSuccessfulPayment(payment.id, cashfreeOrder.cf_payment_id || cashfreeOrder.payment_id);
            payment.payment_status = 'PAID';
            payment.cf_order_status = 'SUCCESS';
          }
        } else if (cashfreeOrder.order_status === 'FAILED' || cashfreeOrder.order_status === 'CANCELLED') {
          await pool.query(
            `UPDATE payments
             SET payment_status = 'FAILED',
                 cf_order_status = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [cashfreeOrder.order_status, payment.id]
          );
          payment.payment_status = 'FAILED';
          payment.cf_order_status = cashfreeOrder.order_status;
        } else if (cashfreeOrder.order_status === 'ACTIVE' || cashfreeOrder.order_status === 'PENDING') {
          payment.cf_order_status = cashfreeOrder.order_status;
        }
      } catch (verifyError) {
        console.error('Error verifying payment with Cashfree:', verifyError);
        // Return local status if verification fails
      }
    }

    res.json({
      order_id: orderId,
      order_number: payment.order_number,
      order_status: payment.order_status,
      payment_status: payment.payment_status,
      cf_order_status: payment.cf_order_status,
      amount: payment.final_amount,
      cashfree_order_id: payment.cashfree_order_id,
      payment_session_id: payment.payment_session_id
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment status' });
  }
};

const handleWebhook = async (req, res) => {
  const signature = req.headers['x-webhook-signature'] || req.headers['x-cf-webhook-signature'];

  if (!signature) {
    console.error('Webhook received without signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CASHFREE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // Note: In production, implement proper signature verification here
  // This is a simplified version for development
  console.log('Webhook received (signature verification skipped in development)');

  try {
    const event = req.body;

    if (!event || !event.data || !event.data.order) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const cashfreeOrderId = event.data.order.order_id;
    const orderStatus = event.data.order.order_status;
    const paymentId = event.data.payment?.cf_payment_id;

    console.log(`Webhook: Cashfree order ${cashfreeOrderId}, status ${orderStatus}`);

    // Find payment by Cashfree order ID
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE cashfree_order_id = $1',
      [cashfreeOrderId]
    );

    if (paymentResult.rows.length === 0) {
      console.error(`Payment not found for Cashfree order ${cashfreeOrderId}`);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Check if already processed
    if (payment.webhook_processed) {
      console.log(`Webhook already processed for payment ${payment.id}`);
      return res.json({ message: 'Webhook already processed' });
    }

    // Process based on order status
    if (orderStatus === 'PAID' || orderStatus === 'SUCCESS') {
      if (payment.payment_status !== 'PAID') {
        await processSuccessfulPayment(payment.id, paymentId);
      }
    } else if (orderStatus === 'FAILED' || orderStatus === 'CANCELLED' || orderStatus === 'EXPIRED') {
      await pool.query(
        `UPDATE payments
         SET payment_status = 'FAILED',
             cf_order_status = $1,
             webhook_processed = true,
             webhook_received_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [orderStatus, payment.id]
      );

      await pool.query(
        `UPDATE orders
         SET order_status = 'PAYMENT_FAILED',
             updated_at = NOW()
         WHERE id = $1`,
        [payment.order_id]
      );
    }

    // Mark webhook as processed
    await pool.query(
      'UPDATE payments SET webhook_processed = true, webhook_received_at = NOW() WHERE id = $1',
      [payment.id]
    );

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

module.exports = {
  getOrder,
  getPaymentStatus,
  handleWebhook
};