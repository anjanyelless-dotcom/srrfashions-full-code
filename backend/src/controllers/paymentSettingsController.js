require('dotenv-flow/config');

const getPaymentSettings = async (req, res) => {
  try {
    const livePaymentTestMode = process.env.LIVE_PAYMENT_TEST_MODE === 'true';
    const livePaymentTestAmount = livePaymentTestMode
      ? parseFloat(process.env.LIVE_PAYMENT_TEST_AMOUNT || '1.00')
      : null;

    res.json({
      upi_id: process.env.UPI_ID || '',
      upi_qr_url: process.env.UPI_QR_IMAGE_URL || '',
      payee_name: process.env.UPI_PAYEE_NAME || 'SR Selections',
      currency: 'INR',
      symbol: '₹',
      live_payment_test_mode: livePaymentTestMode,
      live_payment_test_amount: livePaymentTestAmount
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({ error: 'Failed to load payment settings' });
  }
};

module.exports = {
  getPaymentSettings
};
