require('dotenv').config();

async function debugCheckoutFlow() {
  console.log('=== STEP 1: Capture Exact Cashfree Create Order Response from Our Backend ===\n');

  // Create fresh order via API
  console.log('1. Creating fresh order via API...');
  const email = `debugtest${Date.now()}@example.com`;
  const mobile = '9' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  const password = 'Password123!';

  const regRes = await fetch('http://localhost:3000/api/auth/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: 'Debug Test', email, mobile_number: mobile, password }),
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log('✓ User registered');
  console.log('');

  await fetch('http://localhost:3000/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: 1, variant_id: 2, quantity: 1 })
  });
  console.log('✓ Product added to cart');
  console.log('');

  const addrRes = await fetch('http://localhost:3000/api/customer/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Debug Address',
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
  console.log('');

  console.log('2. Calling POST /api/checkout...');
  const checkoutRes = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ address_id: addressId, payment_method: 'UPI' })
  });

  console.log('Checkout Response Status:', checkoutRes.status);
  console.log('');

  const checkoutData = await checkoutRes.json();
  console.log('=== Backend Checkout Response (Safe Data) ===');
  console.log('Internal Order ID:', checkoutData.order?.id);
  console.log('Order Number:', checkoutData.order?.order_number);
  console.log('Order Amount:', checkoutData.order?.final_amount);
  console.log('Order Status:', checkoutData.order?.order_status);
  console.log('Cashfree Order ID:', checkoutData.payment?.cashfree_order_id);
  console.log('');

  if (checkoutData.payment?.payment_session_id) {
    console.log('=== Payment Session ID Analysis ===');
    console.log('Type:', typeof checkoutData.payment.payment_session_id);
    console.log('Length:', checkoutData.payment.payment_session_id.length);
    console.log('Prefix:', checkoutData.payment.payment_session_id.substring(0, 8));
    console.log('Suffix:', checkoutData.payment.payment_session_id.substring(checkoutData.payment.payment_session_id.length - 8));
    console.log('Is non-empty string:', checkoutData.payment.payment_session_id.length > 0);
    console.log('Starts with "session_":', checkoutData.payment.payment_session_id.startsWith('session_'));
  } else {
    console.log('ERROR: No payment_session_id in checkout response');
  }

  console.log('');
  console.log('=== STEP 3: Verify Session Against Same Order ===');
  const cashfreeOrderId = checkoutData.payment?.cashfree_order_id;
  console.log('Testing GET /pg/orders/ for Cashfree order:', cashfreeOrderId);

  const getResponse = await fetch(`http://localhost:3000/api/cashfree/orders/${cashfreeOrderId}`);
  console.log('GET Response Status:', getResponse.status);
  const getData = await getResponse.json();

  console.log('GET order_id:', getData.order_id);
  console.log('GET cf_order_id:', getData.cf_order_id);
  console.log('GET order_status:', getData.order_status);

  if (getData.payment_session_id) {
    console.log('GET payment_session_id Type:', typeof getData.payment_session_id);
    console.log('GET payment_session_id Length:', getData.payment_session_id.length);
    console.log('GET payment_session_id Prefix:', getData.payment_session_id.substring(0, 8));
    console.log('GET payment_session_id Suffix:', getData.payment_session_id.substring(getData.payment_session_id.length - 8));
  }

  console.log('');
  console.log('=== Session ID Comparison ===');
  console.log('Backend Session ID:', checkoutData.payment?.payment_session_id?.substring(0, 8) + '...' + checkoutData.payment?.payment_session_id?.substring(checkoutData.payment?.payment_session_id?.length - 8));
  console.log('Get Order Session ID:', getData.payment_session_id?.substring(0, 8) + '...' + getData.payment_session_id?.substring(getData.payment_session_id?.length - 8));
  console.log('Session IDs Match:', checkoutData.payment?.payment_session_id === getData.payment_session_id);

  console.log('');
  console.log('=== STEP 8: Check Cashfree Order Parameters ===');
  console.log('Customer Details from Get Order:');
  console.log('Customer ID:', getData.customer_details?.customer_id);
  console.log('Customer Name:', getData.customer_details?.customer_name);
  console.log('Customer Email:', getData.customer_details?.customer_email);
  console.log('Customer Phone:', getData.customer_details?.customer_phone);
  console.log('');
  console.log('Order Meta from Get Order:');
  console.log('Return URL:', getData.order_meta?.return_url);
  console.log('Notify URL:', getData.order_meta?.notify_url);

  return {
    success: checkoutRes.ok,
    internalOrderId: checkoutData.order?.id,
    cashfreeOrderId: checkoutData.payment?.cashfree_order_id,
    backendSession: checkoutData.payment?.payment_session_id,
    getSession: getData.payment_session_id
  };
}

debugCheckoutFlow().then(result => {
  console.log('\n=== Backend Checkout Flow Debug Complete ===');
  console.log('Success:', result.success);
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});