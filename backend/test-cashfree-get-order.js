require('dotenv').config();

async function testCashfreeGetOrder(orderId) {
  console.log('=== STEP 8: Test Cashfree Get Order API ===\n');

  const CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
  const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
  const BASE_URL = process.env.CASHFREE_BASE_URL;
  const API_VERSION = process.env.CASHFREE_API_VERSION;

  console.log('Test Configuration:');
  console.log('BASE_URL:', BASE_URL);
  console.log('API_VERSION:', API_VERSION);
  console.log('Order ID:', orderId);
  console.log('');

  try {
    const response = await fetch(`${BASE_URL}/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CLIENT_ID,
        'x-client-secret': CLIENT_SECRET,
        'x-api-version': API_VERSION
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('');

    const responseData = await response.json();
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    console.log('');

    console.log('=== Key Response Fields ===');
    console.log('order_id:', responseData.order_id);
    console.log('cf_order_id:', responseData.cf_order_id);
    console.log('order_amount:', responseData.order_amount);
    console.log('order_currency:', responseData.order_currency);
    console.log('order_status:', responseData.order_status);
    console.log('entity:', responseData.entity);

    if (responseData.payment_session_id) {
      console.log('');
      console.log('=== Payment Session ID Analysis ===');
      console.log('Type:', typeof responseData.payment_session_id);
      console.log('Length:', responseData.payment_session_id.length);
      console.log('Prefix:', responseData.payment_session_id.substring(0, 8));
      console.log('Suffix:', responseData.payment_session_id.substring(responseData.payment_session_id.length - 8));
      console.log('Starts with "session_":', responseData.payment_session_id.startsWith('session_'));
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

// Use the order ID from our checkout test
const orderId = 'ORD-1787589782198';

testCashfreeGetOrder(orderId).then(result => {
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