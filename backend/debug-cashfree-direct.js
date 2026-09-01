require('dotenv').config();

async function debugCashfreeDirect() {
  console.log('=== STEP 2: Test Cashfree Direct API ===\n');

  const CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
  const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
  const BASE_URL = process.env.CASHFREE_BASE_URL;
  const API_VERSION = process.env.CASHFREE_API_VERSION;

  const uniqueOrderId = `DEBUG_${Date.now()}`;
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
      customer_id: 'DEBUG_CUSTOMER_001',
      customer_name: 'Debug Test Customer',
      customer_email: 'debug@example.com',
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

    console.log('=== STEP 1: Capture Exact Cashfree Create Order Response ===');
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('');

    const responseData = await response.json();
    console.log('=== Safe Response Data (No Secrets) ===');
    console.log('order_id:', responseData.order_id);
    console.log('cf_order_id:', responseData.cf_order_id);
    console.log('order_amount:', responseData.order_amount);
    console.log('order_currency:', responseData.order_currency);
    console.log('order_status:', responseData.order_status);
    console.log('entity:', responseData.entity);
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
    console.log('=== STEP 3: Verify Session Against Same Order ===');
    console.log('Testing GET /pg/orders/ for the same order...');

    const getResponse = await fetch(`${BASE_URL}/pg/orders/${uniqueOrderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CLIENT_ID,
        'x-client-secret': CLIENT_SECRET,
        'x-api-version': API_VERSION
      }
    });

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
    console.log('Create Order Session ID:', responseData.payment_session_id?.substring(0, 8) + '...' + responseData.payment_session_id?.substring(responseData.payment_session_id?.length - 8));
    console.log('Get Order Session ID:', getData.payment_session_id?.substring(0, 8) + '...' + getData.payment_session_id?.substring(getData.payment_session_id?.length - 8));
    console.log('Session IDs Match:', responseData.payment_session_id === getData.payment_session_id);

    return {
      success: response.ok,
      orderId: uniqueOrderId,
      cfOrderId: responseData.cf_order_id,
      createSession: responseData.payment_session_id,
      getSession: getData.payment_session_id
    };

  } catch (error) {
    console.error('ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

debugCashfreeDirect().then(result => {
  console.log('\n=== Direct API Test Complete ===');
  console.log('Success:', result.success);
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});