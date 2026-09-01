require('dotenv').config();

async function testCheckoutAPI() {
  console.log('=== STEP 4: Test POST /api/checkout API ===\n');

  const API_BASE = 'http://localhost:3000';

  // Create test user
  console.log('1. Creating test user...');
  const email = `checkoutapitest${Date.now()}@example.com`;
  const mobile = '9' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  const password = 'Password123!';

  const regResponse = await fetch(`${API_BASE}/api/auth/customer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Checkout API Test',
      email,
      mobile_number: mobile,
      password
    })
  });

  const regData = await regResponse.json();
  if (!regData.token) {
    console.error('Failed to register user:', regData);
    return { success: false, error: 'User registration failed' };
  }

  const token = regData.token;
  console.log('✓ User registered:', email);
  console.log('');

  // Add product to cart
  console.log('2. Adding product to cart...');
  const cartResponse = await fetch(`${API_BASE}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: 1,
      variant_id: 2,
      quantity: 1
    })
  });

  const cartData = await cartResponse.json();
  console.log('✓ Product added to cart');
  console.log('');

  // Create address
  console.log('3. Creating address...');
  const addrResponse = await fetch(`${API_BASE}/api/customer/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'API Test Address',
      mobile_number: '9876543210',
      house_flat: '123',
      street_area: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      landmark: 'Test Landmark'
    })
  });

  const addrData = await addrResponse.json();
  const addressId = addrData.address?.id;
  if (!addressId) {
    console.error('Failed to create address:', addrData);
    return { success: false, error: 'Address creation failed' };
  }
  console.log('✓ Address created with ID:', addressId);
  console.log('');

  // Test checkout API
  console.log('4. Testing POST /api/checkout...');
  const checkoutResponse = await fetch(`${API_BASE}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      address_id: addressId,
      payment_method: 'UPI'
    })
  });

  console.log('Response Status:', checkoutResponse.status);
  console.log('Response Status Text:', checkoutResponse.statusText);
  console.log('');

  const checkoutData = await checkoutResponse.json();
  console.log('Response Body:', JSON.stringify(checkoutData, null, 2));
  console.log('');

  // Analyze response
  console.log('=== Response Analysis ===');
  console.log('Order ID:', checkoutData.order?.id);
  console.log('Order Number:', checkoutData.order?.order_number);
  console.log('Order Amount:', checkoutData.order?.final_amount);
  console.log('Order Status:', checkoutData.order?.order_status);
  console.log('');

  if (checkoutData.payment) {
    console.log('Payment ID:', checkoutData.payment.id);
    console.log('Payment Amount:', checkoutData.payment.amount);
    console.log('Payment Method:', checkoutData.payment.payment_method);
    console.log('Payment Status:', checkoutData.payment.payment_status);
    console.log('Cashfree Order ID:', checkoutData.payment.cashfree_order_id);

    if (checkoutData.payment.payment_session_id) {
      console.log('');
      console.log('=== Payment Session ID Analysis ===');
      console.log('Type:', typeof checkoutData.payment.payment_session_id);
      console.log('Length:', checkoutData.payment.payment_session_id.length);
      console.log('Prefix:', checkoutData.payment.payment_session_id.substring(0, 8));
      console.log('Suffix:', checkoutData.payment.payment_session_id.substring(checkoutData.payment.payment_session_id.length - 8));
      console.log('Is non-empty string:', checkoutData.payment.payment_session_id.length > 0);
      console.log('Starts with "session_":', checkoutData.payment.payment_session_id.startsWith('session_'));
    } else {
      console.log('ERROR: No payment_session_id in response');
    }
  } else {
    console.log('ERROR: No payment object in response');
  }

  return {
    success: checkoutResponse.ok,
    status: checkoutResponse.status,
    data: checkoutData,
    orderId: checkoutData.order?.id,
    orderNumber: checkoutData.order?.order_number,
    paymentSessionId: checkoutData.payment?.payment_session_id,
    cashfreeOrderId: checkoutData.payment?.cashfree_order_id
  };
}

testCheckoutAPI().then(result => {
  console.log('\n=== Test Result ===');
  console.log('Success:', result.success);
  if (!result.success) {
    console.log('Error:', result.error || 'API call failed');
  }
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});