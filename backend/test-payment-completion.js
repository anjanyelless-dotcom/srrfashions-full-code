const puppeteer = require('/private/tmp/node_modules/puppeteer-core');

async function testPaymentCompletion() {
  console.log('=== Cashfree Payment Completion Test ===\n');

  // Create fresh order via API
  console.log('1. Creating fresh order via API...');
  const email = `paymenttest${Date.now()}@example.com`;
  const mobile = '9' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  const password = 'Password123!';

  const regRes = await fetch('http://localhost:3000/api/auth/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: 'Payment Completion Test', email, mobile_number: mobile, password }),
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log('✓ User registered');

  await fetch('http://localhost:3000/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: 1, variant_id: 2, quantity: 1 })
  });
  console.log('✓ Product added to cart');

  const addrRes = await fetch('http://localhost:3000/api/customer/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Payment Test Address',
      mobile_number: '9876543210',
      house_flat: '123',
      street_area: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      landmark: 'Test Landmark'
    })
  });
  const addrData = await addrRes.json();
  const addressId = addrData.address?.id;
  console.log('✓ Address created');

  const checkoutRes = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ address_id: addressId, payment_method: 'UPI' })
  });
  const checkoutData = await checkoutRes.json();
  const sessionFromAPI = checkoutData.payment?.payment_session_id;
  const orderId = checkoutData.order?.id;
  const orderNumber = checkoutData.order?.order_number;
  const cashfreeOrderId = checkoutData.payment?.cashfree_order_id;

  console.log('✓ Order created with ID:', orderId);
  console.log('✓ Order Number:', orderNumber);
  console.log('✓ Cashfree Order ID:', cashfreeOrderId);
  console.log('✓ Session ID from API:', {
    length: sessionFromAPI?.length,
    prefix: sessionFromAPI?.substring(0, 8),
    suffix: sessionFromAPI?.substring(sessionFromAPI.length - 8)
  });
  console.log('');

  // Test payment status API
  console.log('2. Testing payment status API before payment...');
  const statusRes = await fetch(`http://localhost:3000/api/customer/orders/${orderId}/payment-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statusData = await statusRes.json();
  console.log('Payment Status Response:', JSON.stringify(statusData, null, 2));
  console.log('');

  // Test Cashfree Get Order API
  console.log('3. Testing Cashfree Get Order API...');
  const cfGetOrderRes = await fetch(`http://localhost:3000/api/cashfree/orders/${cashfreeOrderId}`);
  const cfGetOrderData = await cfGetOrderRes.json();
  console.log('Cashfree Order Response:', JSON.stringify(cfGetOrderData, null, 2));
  console.log('');

  // Test webhook endpoint (simulate)
  console.log('4. Testing webhook endpoint accessibility...');
  try {
    const webhookRes = await fetch('http://localhost:3000/api/cashfree/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          order: {
            order_id: cashfreeOrderId,
            order_status: 'ACTIVE'
          },
          payment: {
            cf_payment_id: 'test_payment_123'
          }
        }
      })
    });
    console.log('Webhook Response Status:', webhookRes.status);
    const webhookData = await webhookRes.json();
    console.log('Webhook Response:', JSON.stringify(webhookData, null, 2));
  } catch (error) {
    console.log('Webhook test failed:', error.message);
  }
  console.log('');

  // Check database state
  console.log('5. Checking database state...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [orderId]
    );
    const payment = paymentResult.rows[0];
    console.log('Payment DB State:', {
      id: payment.id,
      payment_status: payment.payment_status,
      cashfree_order_id: payment.cashfree_order_id,
      payment_session_id: payment.payment_session_id ? payment.payment_session_id.substring(0, 8) + '...' + payment.payment_session_id.substring(payment.payment_session_id.length - 8) : null,
      webhook_processed: payment.webhook_processed,
      cf_order_status: payment.cf_order_status
    });

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );
    const order = orderResult.rows[0];
    console.log('Order DB State:', {
      id: order.id,
      order_status: order.order_status,
      final_amount: order.final_amount
    });

    // Check inventory
    const inventoryResult = await pool.query(
      'SELECT stock_quantity FROM product_variants WHERE id = $1',
      [2]
    );
    console.log('Inventory State:', {
      variant_id: 2,
      stock_quantity: inventoryResult.rows[0].stock_quantity
    });

  } catch (error) {
    console.error('Database check error:', error.message);
  } finally {
    await pool.end();
  }

  console.log('\n=== Test Complete ===');
}

testPaymentCompletion().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});