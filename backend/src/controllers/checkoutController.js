require('dotenv-flow/config');
const pool = require('../config/database');

// Configuration constants
const SHIPPING_FEE = 50; // Flat shipping fee
const FREE_SHIPPING_THRESHOLD = 999; // Free shipping above this amount

const generateOrderNumber = async () => {
  try {
    const result = await pool.query(
      `SELECT order_number FROM orders ORDER BY id DESC LIMIT 1`
    );

    let orderNumber = 'ORD000001';

    if (result.rows.length > 0) {
      const lastOrderNumber = result.rows[0].order_number;
      const lastNumber = parseInt(lastOrderNumber.replace('ORD', ''));
      const newNumber = lastNumber + 1;
      orderNumber = `ORD${String(newNumber).padStart(6, '0')}`;
    }

    return orderNumber;
  } catch (error) {
    console.error('Generate order number error:', error);
    return `ORD${Date.now()}`; // Fallback to timestamp
  }
};

const calculateShippingFee = (subtotal) => {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
};

const validateCartItems = async (cartId) => {
  try {
    const cartItems = await pool.query(
      `SELECT ci.id as cart_item_id, ci.product_id, ci.variant_id, ci.quantity,
              p.name as product_name, p.is_active as product_active,
              pv.id as variant_exists, pv.stock_quantity as available_stock,
              pv.color, pv.size,
              p.selling_price as current_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    const validationErrors = [];
    const validItems = [];

    for (const item of cartItems.rows) {
      if (!item.product_active) {
        validationErrors.push({
          item_id: item.cart_item_id,
          product_name: item.product_name,
          error: 'Product is not available'
        });
        continue;
      }

      if (!item.variant_exists) {
        validationErrors.push({
          item_id: item.cart_item_id,
          product_name: item.product_name,
          error: 'Variant not available'
        });
        continue;
      }

      if (item.quantity > item.available_stock) {
        validationErrors.push({
          item_id: item.cart_item_id,
          product_name: item.product_name,
          error: 'Insufficient stock',
          requested_quantity: item.quantity,
          available_stock: item.available_stock
        });
        continue;
      }

      validItems.push(item);
    }

    return { validationErrors, validItems };
  } catch (error) {
    console.error('Validate cart items error:', error);
    throw error;
  }
};

const calculateCouponDiscount = async (couponCode, cartSubtotal, userId) => {
  if (!couponCode) return { discount: 0, coupon: null };

  try {
    const coupon = await pool.query(
      `SELECT * FROM coupons WHERE code = $1`,
      [couponCode.trim().toUpperCase()]
    );

    if (coupon.rows.length === 0) {
      return { discount: 0, error: 'Invalid coupon code' };
    }

    const couponData = coupon.rows[0];

    if (!couponData.is_active) {
      return { discount: 0, error: 'Coupon is not active' };
    }

    const now = new Date();
    const startDate = new Date(couponData.start_date);
    const expiryDate = new Date(couponData.expiry_date);

    if (now < startDate) {
      return { discount: 0, error: 'Coupon is not yet valid' };
    }

    if (now > expiryDate) {
      return { discount: 0, error: 'Coupon has expired' };
    }

    if (cartSubtotal < parseFloat(couponData.minimum_order)) {
      return {
        discount: 0,
        error: 'Minimum order value not met',
        minimum_order: couponData.minimum_order
      };
    }

    if (couponData.total_usage_limit !== null) {
      const totalUsage = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = $1',
        [couponData.id]
      );

      if (parseInt(totalUsage.rows[0].count) >= couponData.total_usage_limit) {
        return { discount: 0, error: 'Coupon usage limit has been reached' };
      }
    }

    if (couponData.usage_limit_per_customer !== null) {
      const customerUsage = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
        [couponData.id, userId]
      );

      if (parseInt(customerUsage.rows[0].count) >= couponData.usage_limit_per_customer) {
        return { discount: 0, error: 'You have already used this coupon the maximum number of times' };
      }
    }

    let discount = 0;

    if (couponData.discount_type === 'FLAT') {
      discount = parseFloat(couponData.discount_value);
    } else if (couponData.discount_type === 'PERCENT') {
      discount = (cartSubtotal * parseFloat(couponData.discount_value)) / 100;
    }

    if (couponData.maximum_discount !== null && discount > parseFloat(couponData.maximum_discount)) {
      discount = parseFloat(couponData.maximum_discount);
    }

    if (discount > cartSubtotal) {
      discount = cartSubtotal;
    }

    return { discount: parseFloat(discount.toFixed(2)), coupon: couponData };
  } catch (error) {
    console.error('Calculate coupon discount error:', error);
    return { discount: 0, error: 'Failed to calculate coupon discount' };
  }
};

const calculateReferralDiscount = async (useReferralReward, userId) => {
  if (!useReferralReward) return { discount: 0, reward: null };

  try {
    const reward = await pool.query(
      `SELECT rr.*, rs.reward_type
       FROM referral_rewards rr
       CROSS JOIN LATERAL (
         SELECT reward_type FROM referral_settings ORDER BY updated_at DESC LIMIT 1
       ) rs
       WHERE rr.user_id = $1 AND rr.is_used = false AND rr.is_approved = true
       ORDER BY rr.created_at ASC
       LIMIT 1`,
      [userId]
    );

    if (reward.rows.length === 0) {
      return { discount: 0, error: 'No available referral reward found' };
    }

    const rewardData = reward.rows[0];
    const discount = parseFloat(rewardData.reward_amount);

    return { discount, reward: rewardData };
  } catch (error) {
    console.error('Calculate referral discount error:', error);
    return { discount: 0, error: 'Failed to calculate referral discount' };
  }
};

// ============================================================
// TEMPORARY LIVE PAYMENT TEST MODE
// Set LIVE_PAYMENT_TEST_MODE=true and LIVE_PAYMENT_TEST_AMOUNT=1.00
// to force all Cashfree LIVE orders to charge exactly ₹1.00.
// This MUST be disabled (set to false) before real customer payments.
// The override is applied server-side and cannot be bypassed by the frontend.
// ============================================================
const getLivePaymentTestAmount = () => {
  const isTestMode = process.env.LIVE_PAYMENT_TEST_MODE === 'true';
  if (!isTestMode) return null;

  const testAmount = parseFloat(process.env.LIVE_PAYMENT_TEST_AMOUNT || '1.00');
  return isNaN(testAmount) ? 1.00 : testAmount;
};

const resolveCashfreeOrderAmount = (calculatedFinalAmount) => {
  const testAmount = getLivePaymentTestAmount();
  if (testAmount !== null) {
    console.log(`[LIVE PAYMENT TEST MODE] Overriding Cashfree order amount from ${calculatedFinalAmount} to ${testAmount} INR`);
    return testAmount;
  }
  return calculatedFinalAmount;
};

const createCashfreeOrder = async (orderNumber, finalAmount, customerDetails) => {
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

  const cashfreeOrderAmount = resolveCashfreeOrderAmount(finalAmount);

  console.log(`Creating Cashfree order for order ${orderNumber} with amount ${cashfreeOrderAmount}`);

  try {
    const url = `${baseUrl}/pg/orders`;
    const headers = {
      'x-api-version': apiVersion || '2026-01-01',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'Content-Type': 'application/json'
    };

    const requestBody = {
      order_id: orderNumber,
      order_amount: cashfreeOrderAmount.toFixed(2),
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customerDetails.customer_id),
        customer_name: customerDetails.customer_name,
        customer_email: customerDetails.customer_email,
        customer_phone: customerDetails.customer_phone
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/payment?orderId=${customerDetails.internal_order_id}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/cashfree/webhook`
      }
    };

    console.log(`Cashfree request to: ${url}`);
    console.log(`Cashfree order_id: ${requestBody.order_id}, amount: ${requestBody.order_amount}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();

    console.log(`Cashfree response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Cashfree order creation failed: ${response.status}`, responseData);
      throw new Error('Failed to create payment session');
    }

    if (!responseData.payment_session_id || typeof responseData.payment_session_id !== 'string' || responseData.payment_session_id.length < 10) {
      console.error('Cashfree did not return a valid payment session ID');
      throw new Error('Cashfree did not return a payment session');
    }

    console.log(`Cashfree order created successfully: ${responseData.order_id}, payment_session_id length=${responseData.payment_session_id.length}`);

    return {
      cf_order_id: responseData.order_id,
      payment_session_id: responseData.payment_session_id,
      order_status: responseData.order_status,
      order_amount: cashfreeOrderAmount
    };
  } catch (error) {
    console.error(`Cashfree order creation error for ${orderNumber}:`, error.message);
    throw error;
  }
};

const createOrder = async (req, res) => {
  const { address_id, payment_method, coupon_code, use_referral_reward } = req.body;
  const userId = req.user.id;

  // Validation
  if (!address_id) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  if (!['UPI', 'CARD', 'NET_BANKING'].includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  try {
    // Get user's cart
    const cart = await pool.query(
      'SELECT id FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartId = cart.rows[0].id;

    // Validate address ownership
    const address = await pool.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [address_id, userId]
    );

    if (address.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Validate cart items
    const { validationErrors, validItems } = await validateCartItems(cartId);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Cart validation failed',
        validation_errors: validationErrors
      });
    }

    if (validItems.length === 0) {
      return res.status(400).json({ error: 'No valid items in cart' });
    }

    // Calculate subtotal from current backend prices
    let subtotal = 0;
    validItems.forEach(item => {
      const itemTotal = item.current_price * item.quantity;
      subtotal += itemTotal;
    });

    subtotal = parseFloat(subtotal.toFixed(2));

    // Calculate coupon discount
    const couponResult = await calculateCouponDiscount(coupon_code, subtotal, userId);

    if (couponResult.error) {
      return res.status(400).json({
        error: couponResult.error,
        details: couponResult
      });
    }

    const couponDiscount = couponResult.discount;

    // Calculate referral discount
    const useReferralReward = use_referral_reward || false;
    const referralResult = await calculateReferralDiscount(useReferralReward, userId);

    if (referralResult.error && useReferralReward) {
      return res.status(400).json({
        error: referralResult.error,
        details: referralResult
      });
    }

    const referralDiscount = referralResult.discount;

    // Calculate shipping fee
    const shippingFee = calculateShippingFee(subtotal - couponDiscount - referralDiscount);

    // Calculate final amount
    const finalAmount = subtotal - couponDiscount - referralDiscount + shippingFee;

    if (finalAmount <= 0) {
      return res.status(400).json({ error: 'Order total cannot be zero or negative' });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, address_id, order_number, subtotal, coupon_discount, referral_discount, shipping_fee, final_amount, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING *`,
      [
        userId,
        address_id,
        orderNumber,
        subtotal,
        couponDiscount,
        referralDiscount,
        shippingFee,
        finalAmount
      ]
    );

    const order = orderResult.rows[0];

    // Store coupon and referral IDs for later use
    let couponId = couponResult.coupon ? couponResult.coupon.id : null;
    let referralRewardId = referralResult.reward ? referralResult.reward.id : null;

    // Create order items with price snapshots
    for (const item of validItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, color, size, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.color,
          item.size,
          item.quantity,
          item.current_price
        ]
      );
    }

    // Get customer details for Cashfree
    const user = await pool.query(
      'SELECT id, full_name, email, mobile_number FROM users WHERE id = $1',
      [userId]
    );

    const customerDetails = {
      customer_id: user.rows[0].id,
      customer_name: user.rows[0].full_name,
      customer_email: user.rows[0].email,
      customer_phone: user.rows[0].mobile_number,
      internal_order_id: order.id
    };

    // Create Cashfree order if payment method is UPI
    let cashfreeOrder = null;
    if (payment_method === 'UPI') {
      try {
        cashfreeOrder = await createCashfreeOrder(orderNumber, finalAmount, customerDetails);
      } catch (cashfreeError) {
        console.error('Cashfree order creation failed:', cashfreeError);
        return res.status(500).json({
          error: 'Failed to create payment session',
          details: cashfreeError.message
        });
      }
    }

    // Create payment record with Cashfree details
    // Use the actual Cashfree order amount (which may be overridden in test mode)
    const cashfreeOrderAmount = cashfreeOrder?.order_amount || finalAmount;
    const paymentResult = await pool.query(
      `INSERT INTO payments (order_id, amount, payment_method, payment_status, cashfree_order_id, payment_session_id, cf_order_status)
       VALUES ($1, $2, $3, 'PAYMENT_PENDING', $4, $5, $6)
       RETURNING *`,
      [
        order.id,
        cashfreeOrderAmount,
        payment_method,
        cashfreeOrder?.cf_order_id || null,
        cashfreeOrder?.payment_session_id || null,
        cashfreeOrder?.order_status || null
      ]
    );

    const storedPaymentSessionId = paymentResult.rows[0].payment_session_id;
    console.log(`Payment session ID stored in database: length=${storedPaymentSessionId?.length || 0}, prefix=${storedPaymentSessionId?.substring(0, 8) || 'none'}, suffix=${storedPaymentSessionId?.substring((storedPaymentSessionId?.length || 0) - 8) || 'none'}`);

    // Record coupon usage if applicable
    if (couponId) {
      await pool.query(
        'INSERT INTO coupon_usages (coupon_id, user_id, order_id) VALUES ($1, $2, $3)',
        [couponId, userId, order.id]
      );
    }

    // Mark referral reward as used if applicable
    if (referralRewardId) {
      await pool.query(
        'UPDATE referral_rewards SET is_used = true, used_at = NOW() WHERE id = $1',
        [referralRewardId]
      );
    }

    // Note: Cart is NOT cleared here - it will be cleared after successful payment

    // Include test mode status in response so the frontend can display an indicator
    const livePaymentTestMode = process.env.LIVE_PAYMENT_TEST_MODE === 'true';
    const livePaymentTestAmount = livePaymentTestMode
      ? parseFloat(process.env.LIVE_PAYMENT_TEST_AMOUNT || '1.00')
      : null;

    res.status(201).json({
      message: 'Order created successfully',
      live_payment_test_mode: livePaymentTestMode,
      live_payment_test_amount: livePaymentTestAmount,
      order: {
        id: order.id,
        order_number: orderNumber,
        subtotal,
        coupon_discount: couponDiscount,
        referral_discount: referralDiscount,
        shipping_fee: shippingFee,
        final_amount: finalAmount,
        order_status: 'PENDING'
      },
      payment: {
        id: paymentResult.rows[0].id,
        amount: cashfreeOrderAmount,
        payment_method,
        payment_status: 'PAYMENT_PENDING',
        payment_session_id: paymentResult.rows[0].payment_session_id,
        cashfree_order_id: paymentResult.rows[0].cashfree_order_id
      },
      items: validItems.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price_at_purchase: item.current_price
      })),
      address: address.rows[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

module.exports = {
  createOrder
};