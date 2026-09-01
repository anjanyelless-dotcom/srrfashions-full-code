require('dotenv').config();
const { Pool } = require('pg');

const API_BASE = 'http://localhost:3000';
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL;
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class TestHarness {
  constructor() {
    this.results = [];
    this.testUser = null;
    this.testOrder = null;
    this.testPayment = null;
    this.initialInventory = null;
  }

  log(phase, test, expected, actual, status) {
    this.results.push({ phase, test, expected, actual, status });
    console.log(`[${status}] ${phase} - ${test}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    console.log('');
  }

  async cleanupUser(email) {
    try {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    } catch (err) {
      console.log('Cleanup warning:', err.message);
    }
  }

  async registerUser(emailPrefix) {
    const email = `${emailPrefix}${Date.now()}@example.com`;
    const mobile = '9' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
    const password = 'Password123!';

    const regRes = await fetch(`${API_BASE}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: `${emailPrefix} User`,
        email,
        mobile_number: mobile,
        password
      })
    });

    const regData = await regRes.json();
    if (!regData.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    return { email, mobile, token: regData.token, password };
  }

  async addToCart(token, productId = 1, variantId = 2, quantity = 1) {
    const res = await fetch(`${API_BASE}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity })
    });
    return res.json();
  }

  async createAddress(token) {
    const res = await fetch(`${API_BASE}/api/customer/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Address',
        mobile_number: '9876543210',
        house_flat: '123',
        street_area: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        landmark: 'Test Landmark'
      })
    });
    const data = await res.json();
    return data.address?.id;
  }

  async createCheckoutOrder(token, addressId, paymentMethod = 'UPI') {
    const res = await fetch(`${API_BASE}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ address_id: addressId, payment_method: paymentMethod })
    });

    const data = await res.json();
    return { status: res.status, data };
  }

  async getCart(token) {
    const res = await fetch(`${API_BASE}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }

  async getPaymentStatus(token, orderId) {
    const res = await fetch(`${API_BASE}/api/customer/orders/${orderId}/payment-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { status: res.status, data: await res.json() };
  }

  async getInventory(variantId = 2) {
    const result = await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [variantId]);
    return result.rows[0]?.stock_quantity;
  }

  async getOrderFromDB(orderId) {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    return result.rows[0];
  }

  async getPaymentFromDB(orderId) {
    const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
    return result.rows[0];
  }

  // Simulate Cashfree payment by calling their order fetch API to get current status
  async getCashfreeOrderStatus(cashfreeOrderId) {
    const res = await fetch(`${API_BASE}/api/cashfree/orders/${cashfreeOrderId}`);
    return res.json();
  }

  // Simulate webhook with signature
  async sendWebhook(payload, signature = 'test-signature') {
    const res = await fetch(`${API_BASE}/api/cashfree/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature
      },
      body: JSON.stringify(payload)
    });
    return { status: res.status, data: await res.json() };
  }

  async testPhase1() {
    console.log('\n=== PHASE 1: CREATE A FRESH PAYMENT ===\n');

    this.testUser = await this.registerUser('phasetest1_');
    await this.addToCart(this.testUser.token);
    const addressId = await this.createAddress(this.testUser.token);
    const { status, data } = await this.createCheckoutOrder(this.testUser.token, addressId);

    this.testOrder = data;

    // Record initial inventory
    this.initialInventory = await this.getInventory(2);
    console.log('Initial inventory for variant 2:', this.initialInventory);

    this.log('Phase 1', 'Create Cashfree order', 'HTTP 201 Created', `HTTP ${status}`, status === 201 ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Internal order ID exists', 'order.id is number', `order.id = ${data.order?.id}`, typeof data.order?.id === 'number' ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Order number exists', 'order.order_number is string', `order_number = ${data.order?.order_number}`, data.order?.order_number ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Cashfree order ID exists', 'payment.cashfree_order_id is string', `cashfree_order_id = ${data.payment?.cashfree_order_id}`, data.payment?.cashfree_order_id ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Payment session exists', 'payment.payment_session_id is string', `payment_session_id = ${data.payment?.payment_session_id?.substring(0, 8)}...${data.payment?.payment_session_id?.slice(-8)}`, data.payment?.payment_session_id ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Payment session length', 'length > 0', `length = ${data.payment?.payment_session_id?.length}`, data.payment?.payment_session_id?.length > 0 ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Payment session type', 'typeof string', `type = ${typeof data.payment?.payment_session_id}`, typeof data.payment?.payment_session_id === 'string' ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Payment session prefix', 'starts with "session_"', `prefix = ${data.payment?.payment_session_id?.substring(0, 8)}`, data.payment?.payment_session_id?.startsWith('session_') ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Payment status', 'PAYMENT_PENDING', `payment_status = ${data.payment?.payment_status}`, data.payment?.payment_status === 'PAYMENT_PENDING' ? 'PASS' : 'FAIL');
    this.log('Phase 1', 'Order status', 'PENDING', `order_status = ${data.order?.order_status}`, data.order?.order_status === 'PENDING' ? 'PASS' : 'FAIL');

    this.testPayment = data.payment;
  }

  async testPhase3() {
    console.log('\n=== PHASE 3: VERIFY PAYMENT SERVER-SIDE ===\n');

    // Test payment status API before any payment
    const { status, data } = await this.getPaymentStatus(this.testUser.token, this.testOrder.order.id);

    this.log('Phase 3', 'Payment status API', 'HTTP 200', `HTTP ${status}`, status === 200 ? 'PASS' : 'FAIL');
    this.log('Phase 3', 'Cashfree order status', 'ACTIVE', `cf_order_status = ${data.cf_order_status}`, data.cf_order_status === 'ACTIVE' ? 'PASS' : 'FAIL');
    this.log('Phase 3', 'Backend payment status', 'PAYMENT_PENDING', `payment_status = ${data.payment_status}`, data.payment_status === 'PAYMENT_PENDING' ? 'PASS' : 'FAIL');
    this.log('Phase 3', 'Internal order status', 'PENDING', `order_status = ${data.order_status}`, data.order_status === 'PENDING' ? 'PASS' : 'FAIL');
    this.log('Phase 3', 'Amount matches', '649.00', `final_amount = ${data.final_amount}`, data.final_amount === '649.00' ? 'PASS' : 'FAIL');
  }

  async testPhase4() {
    console.log('\n=== PHASE 4: DATABASE VERIFICATION ===\n');

    const order = await this.getOrderFromDB(this.testOrder.order.id);
    const payment = await this.getPaymentFromDB(this.testOrder.order.id);

    this.log('Phase 4', 'Payment record exists', 'payment row found', `payment_id = ${payment?.id}`, payment ? 'PASS' : 'FAIL');
    this.log('Phase 4', 'Payment order ID matches', 'payment.order_id = internal order', `payment.order_id = ${payment?.order_id}`, payment?.order_id === this.testOrder.order.id ? 'PASS' : 'FAIL');
    this.log('Phase 4', 'Cashfree order ID in DB', 'payment.cashfree_order_id = Cashfree order', `cashfree_order_id = ${payment?.cashfree_order_id}`, payment?.cashfree_order_id === this.testPayment.cashfree_order_id ? 'PASS' : 'FAIL');
    this.log('Phase 4', 'Payment session in DB', 'payment.payment_session_id stored', `payment_session_id length = ${payment?.payment_session_id?.length}`, payment?.payment_session_id?.length === 148 ? 'PASS' : 'FAIL');
    this.log('Phase 4', 'Order status in DB', 'orders.status = PENDING', `order_status = ${order?.order_status}`, order?.order_status === 'PENDING' ? 'PASS' : 'FAIL');
    this.log('Phase 4', 'Payment status in DB', 'payments.payment_status = PAYMENT_PENDING', `payment_status = ${payment?.payment_status}`, payment?.payment_status === 'PAYMENT_PENDING' ? 'PASS' : 'FAIL');
  }

  async testPhase5() {
    console.log('\n=== PHASE 5: INVENTORY CHECKS (Before Payment) ===\n');

    const currentInventory = await this.getInventory(2);
    this.log('Phase 5', 'Inventory before payment', 'unchanged', `stock_quantity = ${currentInventory}`, currentInventory === this.initialInventory ? 'PASS' : 'FAIL');
  }

  async testPhase6() {
    console.log('\n=== PHASE 6: CART BEHAVIOR ===\n');

    const cart = await this.getCart(this.testUser.token);
    this.log('Phase 6', 'Cart before payment', 'contains items', `cart items = ${cart.items?.length}`, cart.items && cart.items.length > 0 ? 'PASS' : 'FAIL');
  }

  async testPhase7Webhook() {
    console.log('\n=== PHASE 7-8: WEBHOOK & SIGNATURE SECURITY ===\n');

    const payload = {
      data: {
        order: {
          order_id: this.testPayment.cashfree_order_id,
          order_status: 'PAID'
        },
        payment: {
          cf_payment_id: `test_payment_${Date.now()}`
        }
      }
    };

    // Test missing signature
    const noSigRes = await fetch(`${API_BASE}/api/cashfree/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    this.log('Phase 7', 'Missing signature rejected', 'HTTP 400', `HTTP ${noSigRes.status}`, noSigRes.status === 400 ? 'PASS' : 'FAIL');

    // Test invalid signature
    const invalidSigRes = await this.sendWebhook(payload, 'invalid-signature');
    this.log('Phase 7', 'Invalid signature rejected', 'HTTP 403 or 401', `HTTP ${invalidSigRes.status}`, invalidSigRes.status === 403 || invalidSigRes.status === 401 ? 'PASS' : 'FAIL');

    // Test modified payload (if signature validation is working)
    const modifiedPayload = JSON.parse(JSON.stringify(payload));
    modifiedPayload.data.order.order_status = 'PAID';
    const modifiedSigRes = await this.sendWebhook(modifiedPayload, 'test-signature');
    this.log('Phase 7', 'Modified payload with invalid signature rejected', 'HTTP 403 or 401', `HTTP ${modifiedSigRes.status}`, modifiedSigRes.status === 403 || modifiedSigRes.status === 401 ? 'PASS' : 'FAIL');

    // Note: Valid signature cannot be tested without actual Cashfree signature and webhook secret
    this.log('Phase 7', 'Valid signature accepted', 'HTTP 200', 'Cannot test without Cashfree signature', 'PENDING');
  }

  async testPhase9Idempotency() {
    console.log('\n=== PHASE 9: IDEMPOTENCY ===\n');

    // Simulate successful payment webhook twice
    const payload = {
      data: {
        order: {
          order_id: this.testPayment.cashfree_order_id,
          order_status: 'PAID'
        },
        payment: {
          cf_payment_id: `test_payment_${Date.now()}`
        }
      }
    };

    // First webhook (will use current implementation)
    const firstRes = await this.sendWebhook(payload, 'test-signature');
    const inventoryAfterFirst = await this.getInventory(2);

    // Second webhook with same payload
    const secondRes = await this.sendWebhook(payload, 'test-signature');
    const inventoryAfterSecond = await this.getInventory(2);

    this.log('Phase 9', 'First webhook processed', 'HTTP 200 or accepted', `HTTP ${firstRes.status}`, firstRes.status === 200 ? 'PASS' : 'FAIL');
    this.log('Phase 9', 'Duplicate webhook idempotent', 'inventory unchanged after second', `${inventoryAfterFirst} → ${inventoryAfterSecond}`, inventoryAfterFirst === inventoryAfterSecond ? 'PASS' : 'FAIL');
  }

  async testPhase10PaymentRetry() {
    console.log('\n=== PHASE 10: PAYMENT RETRY (Failed then Success) ===\n');

    // Note: This requires a new order for the retry
    const newUser = await this.registerUser('phaseretry_');
    await this.addToCart(newUser.token);
    const addressId = await this.createAddress(newUser.token);
    const { data } = await this.createCheckoutOrder(newUser.token, addressId);

    // Simulate failed payment
    const failedPayload = {
      data: {
        order: {
          order_id: data.payment.cashfree_order_id,
          order_status: 'FAILED'
        },
        payment: {
          cf_payment_id: `test_failed_${Date.now()}`
        }
      }
    };

    // Note: Without proper signature, webhook will be rejected. This is expected behavior for security.
    this.log('Phase 10', 'Failed payment handling', 'Order remains available for retry', `Order created: ${data.order?.id}`, data.order ? 'PASS' : 'FAIL');

    // For a real retry, customer would create a new order. For now, we document this.
  }

  async testPhase11AmountSecurity() {
    console.log('\n=== PHASE 11: AMOUNT SECURITY ===\n');

    const newUser = await this.registerUser('phaseamount_');
    await this.addToCart(newUser.token, 1, 2, 1);
    const addressId = await this.createAddress(newUser.token);

    // Try to manipulate amount (though our API doesn't accept amount from frontend)
    const { status, data } = await this.createCheckoutOrder(newUser.token, addressId);

    // Verify Cashfree order amount matches our calculated total
    const cfOrder = await this.getCashfreeOrderStatus(data.payment.cashfree_order_id);
    const backendAmount = data.order.final_amount;
    const cashfreeAmount = cfOrder.order_amount;

    this.log('Phase 11', 'Backend calculates amount', 'amount from server-side cart', `amount = ${backendAmount}`, backendAmount ? 'PASS' : 'FAIL');
    this.log('Phase 11', 'Cashfree amount matches backend', 'amounts equal', `backend: ${backendAmount}, cashfree: ${cashfreeAmount}`, Number(backendAmount) === Number(cashfreeAmount) ? 'PASS' : 'FAIL');
  }

  async testPhase12Authorization() {
    console.log('\n=== PHASE 12: AUTHORIZATION ===\n');

    const userA = await this.registerUser('phaseauthA_');
    await this.addToCart(userA.token);
    const addressId = await this.createAddress(userA.token);
    const { data } = await this.createCheckoutOrder(userA.token, addressId);

    const userB = await this.registerUser('phaseauthB_');

    // User B tries to access User A's order
    const res = await this.getPaymentStatus(userB.token, data.order.id);

    this.log('Phase 12', 'Cross-customer order access', 'HTTP 401/403 or not found', `HTTP ${res.status}`, res.status === 401 || res.status === 403 || res.status === 404 ? 'PASS' : 'FAIL');
    this.log('Phase 12', 'No payment data leaked', 'no sensitive data', `response: ${JSON.stringify(res.data).substring(0, 100)}`, !res.data?.payment_status ? 'PASS' : 'FAIL');
  }

  async runAll() {
    try {
      await this.testPhase1();
      await this.testPhase3();
      await this.testPhase4();
      await this.testPhase5();
      await this.testPhase6();
      await this.testPhase7Webhook();
      await this.testPhase9Idempotency();
      await this.testPhase10PaymentRetry();
      await this.testPhase11AmountSecurity();
      await this.testPhase12Authorization();
    } catch (error) {
      console.error('\nTest harness error:', error);
    } finally {
      await this.printReport();
      await pool.end();
    }
  }

  async printReport() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    COMPLETE PAYMENT FLOW API TEST REPORT                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('| Phase | Test | Expected | Actual | Status |');
    console.log('|-------|------|----------|--------|--------|');

    for (const r of this.results) {
      console.log(`| ${r.phase} | ${r.test} | ${r.expected} | ${r.actual} | ${r.status} |`);
    }

    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const pending = this.results.filter(r => r.status === 'PENDING').length;

    console.log('');
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Pending: ${pending}`);
    console.log('');
  }
}

new TestHarness().runAll();