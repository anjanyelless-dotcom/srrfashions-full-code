require('dotenv').config();

async function testPaymentStatusAPI(orderId, token) {
  console.log('=== STEP 9: Test Payment Status API ===\n');

  const API_BASE = 'http://localhost:3000';

  console.log('Test Configuration:');
  console.log('API_BASE:', API_BASE);
  console.log('Order ID:', orderId);
  console.log('');

  try {
    const response = await fetch(`${API_BASE}/api/customer/orders/${orderId}/payment-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('');

    const responseData = await response.json();
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    console.log('');

    console.log('=== Key Response Fields ===');
    console.log('Order ID:', responseData.order_id);
    console.log('Order Status:', responseData.order_status);
    console.log('Payment Status:', responseData.payment_status);
    console.log('Payment Method:', responseData.payment_method);
    console.log('Amount:', responseData.amount);

    if (responseData.cashfree_order_id) {
      console.log('Cashfree Order ID:', responseData.cashfree_order_id);
    }

    if (responseData.payment_session_id) {
      console.log('');
      console.log('=== Payment Session ID Analysis ===');
      console.log('Type:', typeof responseData.payment_session_id);
      console.log('Length:', responseData.payment_session_id.length);
      console.log('Prefix:', responseData.payment_session_id.substring(0, 8));
      console.log('Suffix:', responseData.payment_session_id.substring(responseData.payment_session_id.length - 8));
      console.log('Starts with "session_":', responseData.payment_session_id.startsWith('session_'));
    }

    if (responseData.cashfree_payment_status) {
      console.log('Cashfree Payment Status:', responseData.cashfree_payment_status);
    }

    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };

  } catch (error) {
    console.error('ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// Create a fresh test user and test payment status
async function runFullTest() {
  console.log('Creating fresh test user...');
  const email = `paymentstatustest${Date.now()}@example.com`;
  const mobile = '9' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  const password = 'Password123!';

  const regResponse = await fetch('http://localhost:3000/api/auth/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Payment Status Test',
      email,
      mobile_number: mobile,
      password
    })
  });

  const regData = await regResponse.json();
  if (!regData.token) {
    console.error('Failed to register user:', regData);
    return null;
  }

  const token = regData.token;
  console.log('✓ User registered');

  // Add product to cart
  await fetch('http://localhost:3000/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: 1, variant_id: 2, quantity: 1 })
  });

  // Create address
  const addrResponse = await fetch('http://localhost:3000/api/customer/addresses', {
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

  const addrData = await addrResponse.json();
  const addressId = addrData.address?.id;

  // Create order
  const checkoutResponse = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ address_id: addressId, payment_method: 'UPI' })
  });

  const checkoutData = await checkoutResponse.json();
  const orderId = checkoutData.order?.id;

  if (!orderId) {
    console.error('Failed to create order');
    return null;
  }

  console.log('✓ Order created with ID:', orderId);
  console.log('');

  return testPaymentStatusAPI(orderId, token);
}

runFullTest().then(result => {
  console.log('\n=== Test Result ===');
  console.log('Success:', result.success);
  if (!result.success) {
    console.log('Error:', result.error);
  }
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});