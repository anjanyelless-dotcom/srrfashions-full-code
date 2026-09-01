require('dotenv-flow/config');
const pool = require('../config/database');
const storage = require('../storage/storageAdapter');

const validateUTR = (utr) => {
  const utrRegex = /^[A-Za-z0-9]{12,22}$/;
  return utrRegex.test(utr);
};

const uploadScreenshot = async (screenshot, existingUrl) => {
  if (!screenshot) return null;
  const url = await storage.uploadFile(screenshot, 'payments');
  if (existingUrl) {
    await storage.deleteFile(existingUrl);
  }
  return url;
};

const hasProof = (utr_number, screenshot) => {
  return !!(utr_number && utr_number.trim()) || !!screenshot;
};

const submitPayment = async (req, res) => {
  const { orderId } = req.params;
  const { utr_number, notes } = req.body || {};
  const screenshot = req.file;
  const userId = req.user.id;

  if (!hasProof(utr_number, screenshot)) {
    return res.status(400).json({ error: 'Please provide a UTR number or a payment screenshot' });
  }

  if (utr_number && !validateUTR(utr_number.trim())) {
    return res.status(400).json({ error: 'Invalid UTR format. UTR must be 12-22 alphanumeric characters' });
  }

  try {
    const order = await pool.query(
      `SELECT o.*, p.id as payment_id, p.payment_status, p.screenshot_url
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = order.rows[0];

    if (orderData.order_status !== 'PENDING') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    if (orderData.payment_id) {
      if (orderData.payment_status === 'PAYMENT_VERIFICATION_PENDING' || orderData.payment_status === 'PAID') {
        return res.status(400).json({ error: 'Payment already submitted for this order' });
      }
      if (orderData.payment_status === 'REJECTED') {
        return res.status(400).json({ error: 'Payment was rejected. Please use resubmission endpoint' });
      }
    }

    if (utr_number && utr_number.trim()) {
      const duplicateUTR = await pool.query(
        'SELECT id FROM payments WHERE utr_number = $1 AND (order_id != $2 OR order_id IS NULL)',
        [utr_number.trim(), orderId]
      );

      if (duplicateUTR.rows.length > 0) {
        return res.status(400).json({ error: 'UTR number already used in another transaction' });
      }
    }

    let screenshotUrl = null;
    if (screenshot) {
      try {
        screenshotUrl = await uploadScreenshot(screenshot);
      } catch (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload screenshot' });
      }
    }

    const cleanUtr = utr_number ? utr_number.trim() : null;
    const cleanNotes = notes ? notes.trim() : null;

    let paymentResult;

    if (orderData.payment_id && orderData.payment_status === 'PAYMENT_PENDING') {
      paymentResult = await pool.query(
        `UPDATE payments
         SET utr_number = $1, screenshot_url = $2, payment_status = 'PAYMENT_VERIFICATION_PENDING', payment_notes = $3, updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [cleanUtr, screenshotUrl, cleanNotes, new Date(), orderData.payment_id]
      );
    } else {
      paymentResult = await pool.query(
        `INSERT INTO payments (order_id, payment_method, amount, utr_number, screenshot_url, payment_status, payment_notes)
         VALUES ($1, 'UPI', $2, $3, $4, 'PAYMENT_VERIFICATION_PENDING', $5)
         RETURNING *`,
        [orderId, orderData.final_amount, cleanUtr, screenshotUrl, cleanNotes]
      );
    }

    await pool.query(
      `UPDATE orders
       SET order_status = 'PAYMENT_VERIFICATION_PENDING'
       WHERE id = $1`,
      [orderId]
    );

    res.status(201).json({
      message: 'Payment submitted successfully',
      payment: {
        id: paymentResult.rows[0].id,
        utr_number: paymentResult.rows[0].utr_number,
        screenshot_url: paymentResult.rows[0].screenshot_url,
        payment_notes: paymentResult.rows[0].payment_notes,
        payment_status: 'PAYMENT_VERIFICATION_PENDING'
      }
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
};

const resubmitPayment = async (req, res) => {
  const { orderId } = req.params;
  const { utr_number, notes } = req.body || {};
  const screenshot = req.file;
  const userId = req.user.id;

  if (!hasProof(utr_number, screenshot)) {
    return res.status(400).json({ error: 'Please provide a UTR number or a payment screenshot' });
  }

  if (utr_number && !validateUTR(utr_number.trim())) {
    return res.status(400).json({ error: 'Invalid UTR format. UTR must be 12-22 alphanumeric characters' });
  }

  try {
    const order = await pool.query(
      `SELECT o.*, p.id as payment_id, p.payment_status, p.screenshot_url
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = order.rows[0];

    if (!orderData.payment_id) {
      return res.status(400).json({ error: 'No previous payment found for this order' });
    }

    if (orderData.payment_status !== 'REJECTED') {
      return res.status(400).json({ error: 'Payment can only be resubmitted if previous attempt was rejected' });
    }

    if (utr_number && utr_number.trim()) {
      const duplicateUTR = await pool.query(
        'SELECT id FROM payments WHERE utr_number = $1 AND id != $2',
        [utr_number.trim(), orderData.payment_id]
      );

      if (duplicateUTR.rows.length > 0) {
        return res.status(400).json({ error: 'UTR number already used in another transaction' });
      }
    }

    let screenshotUrl = orderData.screenshot_url;
    if (screenshot) {
      try {
        screenshotUrl = await uploadScreenshot(screenshot, orderData.screenshot_url);
      } catch (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload screenshot' });
      }
    }

    const cleanUtr = utr_number ? utr_number.trim() : null;
    const cleanNotes = notes ? notes.trim() : null;

    const paymentResult = await pool.query(
      `UPDATE payments
       SET utr_number = $1, screenshot_url = $2, payment_status = 'PAYMENT_VERIFICATION_PENDING',
           rejection_reason = NULL, payment_notes = $3, updated_at = $4
       WHERE id = $5
       RETURNING *`,
      [cleanUtr, screenshotUrl, cleanNotes, new Date(), orderData.payment_id]
    );

    await pool.query(
      `UPDATE orders
       SET order_status = 'PAYMENT_VERIFICATION_PENDING'
       WHERE id = $1`,
      [orderId]
    );

    res.json({
      message: 'Payment resubmitted successfully',
      payment: {
        id: paymentResult.rows[0].id,
        utr_number: paymentResult.rows[0].utr_number,
        screenshot_url: paymentResult.rows[0].screenshot_url,
        payment_notes: paymentResult.rows[0].payment_notes,
        payment_status: 'PAYMENT_VERIFICATION_PENDING'
      }
    });
  } catch (error) {
    console.error('Resubmit payment error:', error);
    res.status(500).json({ error: 'Failed to resubmit payment' });
  }
};

module.exports = {
  submitPayment,
  resubmitPayment
};
