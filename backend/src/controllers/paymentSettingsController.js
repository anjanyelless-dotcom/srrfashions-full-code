require('dotenv-flow/config');

const getPaymentSettings = async (req, res) => {
  try {
    res.json({
      upi_id: process.env.UPI_ID || '',
      upi_qr_url: process.env.UPI_QR_IMAGE_URL || '',
      payee_name: process.env.UPI_PAYEE_NAME || 'SR Selections',
      currency: 'INR',
      symbol: '₹'
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({ error: 'Failed to load payment settings' });
  }
};

module.exports = {
  getPaymentSettings
};
