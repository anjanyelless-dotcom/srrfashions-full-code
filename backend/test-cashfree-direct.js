require('dotenv-flow/config');

async function testCashfreeAPI() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const apiVersion = process.env.CASHFREE_API_VERSION;
  const baseUrl = process.env.CASHFREE_BASE_URL;

  console.log('Cashfree configuration:');
  console.log('CLIENT_ID:', clientId ? 'configured' : 'NOT configured');
  console.log('CLIENT_SECRET:', clientSecret ? 'configured' : 'NOT configured');
  console.log('BASE_URL:', baseUrl);
  console.log('API_VERSION:', apiVersion);

  if (!clientId || !clientSecret || !baseUrl) {
    console.error('Cashfree credentials not configured');
    return;
  }

  const testOrder = {
    order_id: `test_order_${Date.now()}`,
    order_amount: '1.00',
    order_currency: 'INR',
    customer_details: {
      customer_id: '12345',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '9876543210'
    },
    order_meta: {
      return_url: 'http://localhost:5173/#/payment?orderId=999',
      notify_url: 'http://localhost:3000/api/cashfree/webhook',
      payment_methods: 'upi'
    }
  };

  console.log('Test order:', testOrder);

  try {
    const response = await fetch(`${baseUrl}/pg/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': apiVersion || '2026-01-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.payment_session_id) {
      console.log('✓ Payment session ID:', data.payment_session_id);
    } else {
      console.log('✗ No payment session ID in response');
    }
  } catch (error) {
    console.error('Cashfree API error:', error.message);
  }
}

testCashfreeAPI();