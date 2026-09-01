require('dotenv').config();

async function testCashfreeAPI() {
  console.log('=== STEP 2: Test Cashfree Sandbox API Directly ===\n');

  const CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
  const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
  const BASE_URL = process.env.CASHFREE_BASE_URL;
  const API_VERSION = process.env.CASHFREE_API_VERSION;

  const uniqueOrderId = `TEST_API_${Date.now()}`;
  const orderAmount = '10.00';

  console.log('Test Configuration:');
  console.log('BASE_URL:', BASE_URL);
  console.log('API_VERSION:', API_VERSION);
  console.log('Order ID:', uniqueOrderId);
  console.log('Amount:', orderAmount);
  console.log('');

  const requestBody = {
    order_id: uniqueOrderId,
    order_amount: orderAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id: 'TEST_CUSTOMER_001',
      customer_name: 'API Test Customer',
      customer_email: 'apitest@example.com',
      customer_phone: '9876543210'
    },
    order_meta: {
      return_url: 'http://localhost:5173/#/payment?orderId=999',
      notify_url: 'http://localhost:3000/api/cashfree/webhook'
    }
  };

  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('');

  try {
    const response = await fetch(`${BASE_URL}/pg/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CLIENT_ID,
        'x-client-secret': CLIENT_SECRET,
        'x-api-version': API_VERSION
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('');

    const responseData = await response.json();
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    console.log('');

    if (responseData.payment_session_id) {
      console.log('=== Payment Session ID Analysis ===');
      console.log('Type:', typeof responseData.payment_session_id);
      console.log('Length:', responseData.payment_session_id.length);
      console.log('Prefix:', responseData.payment_session_id.substring(0, 8));
      console.log('Suffix:', responseData.payment_session_id.substring(responseData.payment_session_id.length - 8));
      console.log('Is non-empty string:', responseData.payment_session_id.length > 0);
      console.log('Starts with "session_":', responseData.payment_session_id.startsWith('session_'));
    } else {
      console.log('ERROR: No payment_session_id in response');
    }

    console.log('');
    console.log('=== Key Response Fields ===');
    console.log('order_id:', responseData.order_id);
    console.log('cf_order_id:', responseData.cf_order_id);
    console.log('order_amount:', responseData.order_amount);
    console.log('order_status:', responseData.order_status);
    console.log('payment_session_id exists:', !!responseData.payment_session_id);

    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      orderId: uniqueOrderId
    };

  } catch (error) {
    console.error('ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

testCashfreeAPI().then(result => {
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