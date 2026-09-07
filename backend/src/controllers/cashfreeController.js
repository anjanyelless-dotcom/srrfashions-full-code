require('dotenv-flow/config');
const pool = require('../config/database');
const crypto = require('crypto');

// ============================================================
// Cashfree API helpers
// ============================================================

const getCashfreeConfig = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const apiVersion = process.env.CASHFREE_API_VERSION || '2026-01-01';
  const baseUrl = process.env.CASHFREE_BASE_URL;

  const missing = [];
  if (!clientId) missing.push('CASHFREE_CLIENT_ID');
  if (!clientSecret) missing.push('CASHFREE_CLIENT_SECRET');
  if (!baseUrl) missing.push('CASHFREE_BASE_URL');

  if (missing.length > 0) {
    throw new Error(`Cashfree not configured. Missing: ${missing.join(', ')}`);
  }

  return { clientId, clientSecret, apiVersion, baseUrl };
};

const cashfreeHeaders = (cfg) => ({
  'x-api-version': cfg.apiVersion,
  'x-client-id': cfg.clientId,
  'x-client-secret': cfg.clientSecret,
  'Content-Type': 'application/json'
});

// Fetch order details from Cashfree
const fetchCashfreeOrder = async (cashfreeOrderId) => {
  const cfg = getCashfreeConfig();
  const url = `${cfg.baseUrl}/pg/orders/${encodeURIComponent(cashfreeOrderId)}`;
  const res = await fetch(url, { method: 'GET', headers: cashfreeHeaders(cfg) });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Cashfree Get Order failed: ${res.status}`, data);
    throw new Error(`Cashfree Get Order failed: ${res.status}`);
  }
  return data;
};

// Fetch ALL payment attempts for an order from Cashfree
const fetchCashfreePayments = async (cashfreeOrderId) => {
  const cfg = getCashfreeConfig();
  const url = `${cfg.baseUrl}/pg/orders/${encodeURIComponent(cashfreeOrderId)}/payments`;
  const res = await fetch(url, { method: 'GET', headers: cashfreeHeaders(cfg) });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Cashfree Get Payments failed: ${res.status}`, data);
    throw new Error(`Cashfree Get Payments failed: ${res.status}`);
  }
  // Cashfree returns an array of payment objects
  return Array.isArray(data) ? data : [];
};

// ============================================================
// Central payment synchronisation (single source of truth)
// ============================================================

/**
 * Sync the local DB with Cashfree's actual state.
 * Called by BOTH the webhook handler AND the return/polling endpoint.
 *
 * Steps:
 *   1. Load internal payment + order from DB
 *   2. Call Cashfree Get Order API
 *   3. Call Cashfree Get Payments API (all attempts)
 *   4. Determine the final status from the payments array
 *   5. Atomically update payments + orders + cart
 *
 * Idempotent — safe to call multiple times.
 */
const syncCashfreePaymentStatus = async (internalOrderId) => {
  // 1. Load internal payment + order
  const paymentResult = await pool.query(
    `SELECT p.*, o.user_id, o.final_amount, o.order_number, o.order_status
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     WHERE p.order_id = $1`,
    [internalOrderId]
  );

  if (paymentResult.rows.length === 0) {
    return { synced: false, reason: 'payment_not_found' };
  }

  const payment = paymentResult.rows[0];

  // Already fully processed — nothing to do
  if (payment.payment_status === 'PAID' && payment.cashfree_payment_id) {
    return { synced: true, already: true, payment_status: 'PAID' };
  }

  if (!payment.cashfree_order_id) {
    return { synced: false, reason: 'no_cashfree_order_id' };
  }

  // 2. Fetch order status from Cashfree
  const cfOrder = await fetchCashfreeOrder(payment.cashfree_order_id);
  const cfOrderStatus = cfOrder.order_status; // ACTIVE | PAID | EXPIRED

  // 3. Fetch ALL payment attempts
  const cfPayments = await fetchCashfreePayments(payment.cashfree_order_id);

  // 4. Determine final status from payments array
  //    Cashfree allows multiple attempts — find the definitive one.
  const successPayment = cfPayments.find(p => p.payment_status === 'SUCCESS');
  const failedPayments = cfPayments.filter(p =>
    ['FAILED', 'CANCELLED', 'USER_DROPPED'].includes(p.payment_status)
  );

  // 5. Decide the final local status
  if (successPayment) {
    // --- Payment is confirmed successful ---
    const cfPaymentId = successPayment.cf_payment_id;

    if (payment.payment_status !== 'PAID' || payment.cashfree_payment_id !== String(cfPaymentId)) {
      await processSuccessfulPayment(payment.id, cfPaymentId);
    }

    return {
      synced: true,
      payment_status: 'PAID',
      cf_payment_id: cfPaymentId,
      cf_order_status: cfOrderStatus,
      payment_method: successPayment.payment_group || null
    };
  }

  if (cfOrderStatus === 'EXPIRED') {
    await markPaymentFailed(payment, 'EXPIRED');
    return { synced: true, payment_status: 'FAILED', cf_order_status: 'EXPIRED' };
  }

  // If order is still ACTIVE and there are failed attempts but no success yet,
  // keep it pending — the customer may retry.
  if (cfOrderStatus === 'ACTIVE') {
    // Update cf_order_status to reflect reality
    if (payment.cf_order_status !== 'ACTIVE') {
      await pool.query(
        `UPDATE payments SET cf_order_status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
        [payment.id]
      );
    }
    return { synced: true, payment_status: 'PAYMENT_PENDING', cf_order_status: 'ACTIVE' };
  }

  // All attempts failed and order is not active
  if (failedPayments.length > 0 && !successPayment) {
    await markPaymentFailed(payment, failedPayments[0].payment_status);
    return { synced: true, payment_status: 'FAILED', cf_order_status: failedPayments[0].payment_status };
  }

  // Order is PAID but no individual SUCCESS payment found — edge case
  if (cfOrderStatus === 'PAID') {
    // Use the latest payment attempt's cf_payment_id if available
    const latestPayment = cfPayments[cfPayments.length - 1];
    const cfPaymentId = latestPayment?.cf_payment_id || null;
    await processSuccessfulPayment(payment.id, cfPaymentId);
    return {
      synced: true,
      payment_status: 'PAID',
      cf_payment_id: cfPaymentId,
      cf_order_status: cfOrderStatus
    };
  }

  // Fallback — still pending
  return { synced: true, payment_status: 'PAYMENT_PENDING', cf_order_status: cfOrderStatus };
};

// ============================================================
// Atomic DB updates
// ============================================================

const processSuccessfulPayment = async (paymentId, cashfreePaymentId) => {
  try {
    await pool.query('BEGIN');

    const paymentResult = await pool.query(
      `SELECT p.*, o.user_id, o.final_amount, o.order_number
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.id = $1 FOR UPDATE`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      throw new Error('Payment not found');
    }

    const payment = paymentResult.rows[0];

    // Idempotent — already processed
    if (payment.payment_status === 'PAID') {
      await pool.query('COMMIT');
      return { alreadyProcessed: true };
    }

    // Update payment record
    await pool.query(
      `UPDATE payments
       SET payment_status = 'PAID',
           cashfree_payment_id = $1,
           cf_order_status = 'SUCCESS',
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [cashfreePaymentId, paymentId]
    );

    // Update order status
    await pool.query(
      `UPDATE orders
       SET order_status = 'CONFIRMED',
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

    // Clear the user's cart
    await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)`,
      [payment.user_id]
    );

    await pool.query('COMMIT');

    console.log(`[PAYMENT SYNC] Payment processed: payment_id=${paymentId}, order=${payment.order_number}, cf_payment_id=${cashfreePaymentId}`);
    return { success: true, orderNumber: payment.order_number };
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('[PAYMENT SYNC] Error processing successful payment:', error);
    throw error;
  }
};

const markPaymentFailed = async (payment, cfStatus) => {
  // Only update payment — do NOT cancel the order so the customer can retry
  await pool.query(
    `UPDATE payments
     SET payment_status = 'FAILED',
         cf_order_status = $1,
         updated_at = NOW()
     WHERE id = $2 AND payment_status != 'PAID'`,
    [cfStatus, payment.id]
  );
};

// ============================================================
// Webhook signature verification (Cashfree docs)
// signature = Base64( HMACSHA256( timestamp + rawBody , clientSecret ) )
// ============================================================

const verifyWebhookSignature = (timestamp, rawBody, signature, secret) => {
  try {
    const signedPayload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('base64');
    return expectedSignature === signature;
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
};

// ============================================================
// Route handlers
// ============================================================

// GET /api/cashfree/orders/:orderId  — proxy Cashfree order lookup
const getOrder = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const cfg = getCashfreeConfig();
    const data = await fetchCashfreeOrder(orderId.trim());

    const safeResponse = {
      ...data,
      customer_details: data.customer_details ? {
        customer_id: data.customer_details.customer_id,
        customer_name: data.customer_details.customer_name,
        customer_email: data.customer_details.customer_email,
        customer_phone: data.customer_details.customer_phone
      } : null
    };

    res.json(safeResponse);
  } catch (error) {
    console.error(`Cashfree Get Order error for ${orderId}:`, error.message);
    if (error.message.includes('not configured')) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }
    res.status(500).json({ error: 'Failed to retrieve order status' });
  }
};

// GET /api/cashfree/orders/:orderId/status — called by frontend polling
// This triggers server-side sync with Cashfree, then returns the result.
const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId || isNaN(orderId)) {
    return res.status(400).json({ error: 'Valid order ID is required' });
  }

  try {
    // Trigger central sync (idempotent — safe to call on every poll)
    const syncResult = await syncCashfreePaymentStatus(Number(orderId));

    // Read the now-updated payment record
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

    res.json({
      order_id: Number(orderId),
      order_number: payment.order_number,
      order_status: payment.order_status,
      payment_status: payment.payment_status,
      cf_order_status: payment.cf_order_status,
      amount: payment.final_amount,
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

// POST /api/cashfree/webhook — Cashfree server-to-server notification
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const version = req.headers['x-webhook-version'];

  if (!signature || !timestamp) {
    console.error('Webhook received without signature or timestamp');
    return res.status(400).json({ error: 'Missing signature or timestamp' });
  }

  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientSecret) {
    console.error('CASHFREE_CLIENT_SECRET not configured');
    return res.status(200).json({ message: 'Webhook received, not processed' });
  }

  // req.body is a Buffer because express.raw() was applied to this route
  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    console.error('Webhook: no raw body available (Buffer expected)');
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const payload = rawBody.toString('utf8');

  // Verify signature: HMACSHA256(timestamp + rawPayload, secret) → Base64
  if (!verifyWebhookSignature(timestamp, payload, signature, clientSecret)) {
    console.error('Webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('Webhook signature verified successfully');

  try {
    const event = JSON.parse(payload);

    if (!event?.data?.order?.order_id) {
      console.error('Webhook: missing order data', JSON.stringify(event?.data?.order));
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const cashfreeOrderId = event.data.order.order_id;
    const cfPaymentStatus = event.data?.payment?.payment_status;
    const cfPaymentId = event.data?.payment?.cf_payment_id;
    const eventType = event.type || null;

    console.log(`[WEBHOOK] order=${cashfreeOrderId} payment_status=${cfPaymentStatus} cf_payment_id=${cfPaymentId} type=${eventType}`);

    // Look up our internal payment record
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE cashfree_order_id = $1',
      [cashfreeOrderId]
    );

    if (paymentResult.rows.length === 0) {
      console.error(`Webhook: no payment found for Cashfree order ${cashfreeOrderId}`);
      return res.status(200).json({ message: 'Order not found, acknowledged' });
    }

    const payment = paymentResult.rows[0];
    const internalOrderId = payment.order_id;

    // Idempotency: skip if already fully processed
    if (payment.payment_status === 'PAID' && payment.cashfree_payment_id) {
      console.log(`Webhook: already processed for payment ${payment.id}`);
      return res.json({ message: 'Already processed' });
    }

    // Mark webhook as received
    await pool.query(
      'UPDATE payments SET webhook_received_at = NOW() WHERE id = $1',
      [payment.id]
    );

    // Run the central sync — this calls Cashfree API to verify
    const syncResult = await syncCashfreePaymentStatus(internalOrderId);

    // Mark webhook as fully processed
    await pool.query(
      'UPDATE payments SET webhook_processed = true WHERE id = $1',
      [payment.id]
    );

    console.log(`[WEBHOOK] Sync result for order ${internalOrderId}:`, syncResult);

    res.json({ message: 'Webhook processed', sync: syncResult });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

module.exports = {
  getOrder,
  getPaymentStatus,
  handleWebhook,
  syncCashfreePaymentStatus // exported for potential reuse elsewhere
};
