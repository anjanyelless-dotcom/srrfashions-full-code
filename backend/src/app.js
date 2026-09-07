require('dotenv-flow/config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const healthRouter = require('./routes/health');
const customerAuthRouter = require('./routes/customerAuth');
const adminAuthRouter = require('./routes/adminAuth');
const adminCategoryRouter = require('./routes/adminCategory');
const customerCategoryRouter = require('./routes/customerCategory');
const adminProductRouter = require('./routes/adminProduct');
const adminVariantRouter = require('./routes/adminVariant');
const customerProductRouter = require('./routes/customerProduct');
const cartRouter = require('./routes/cart');
const addressRouter = require('./routes/address');
const adminCouponRouter = require('./routes/adminCoupon');
const customerCouponRouter = require('./routes/customerCoupon');
const adminReferralSettingsRouter = require('./routes/adminReferralSettings');
const customerReferralRouter = require('./routes/customerReferral');
const adminReferralTrackingRouter = require('./routes/adminReferralTracking');
const checkoutRouter = require('./routes/checkout');
const customerPaymentRouter = require('./routes/customerPayment');
const adminPaymentRouter = require('./routes/adminPayment');
const customerOrderRouter = require('./routes/customerOrder');
const adminOrderRouter = require('./routes/adminOrder');
const adminInventoryRouter = require('./routes/adminInventory');
const adminDashboardRouter = require('./routes/adminDashboard');
const adminCustomerRouter = require('./routes/adminCustomer');
const adminBannerRouter = require('./routes/adminBanner');
const homeRouter = require('./routes/home');
const paymentSettingsRouter = require('./routes/paymentSettings');
const cashfreeRouter = require('./routes/cashfree');

const app = express();

app.use(cors({
  origin: [
    'https://www.srrfashions.in',
    'https://srrfashions.in',
    'http://localhost:5173',
    'http://localhost:3001'
  ],
  credentials: true
}));

// Configure raw body parsing for Cashfree webhook endpoint
app.use('/api/cashfree/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve payment-return.html for Cashfree return handling (redirect to frontend)
app.get('/payment-return', (req, res) => {
  const orderId = req.query.orderId;
  const fromCashfree = req.query.from;
  
  if (orderId) {
    // Redirect directly to frontend payment page with return parameters
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.srrfashions.in';
    const redirectUrl = `${frontendUrl}/#/payment?orderId=${orderId}&from=${fromCashfree || 'cashfree'}`;
    console.log('Payment return redirect to:', redirectUrl);
    res.redirect(redirectUrl);
  } else {
    // No orderId, redirect to frontend home
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.srrfashions.in';
    res.redirect(`${frontendUrl}/#/`);
  }
});

app.use('/api/health', healthRouter);
app.use('/api/auth/customer', customerAuthRouter);
app.use('/api/auth/admin', adminAuthRouter);
app.use('/api/admin/categories', adminCategoryRouter);
app.use('/api/categories', customerCategoryRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/admin', adminVariantRouter);
app.use('/api/products', customerProductRouter);
app.use('/api/cart', cartRouter);
app.use('/api/customer/addresses', addressRouter);
app.use('/api/admin/coupons', adminCouponRouter);
app.use('/api/cart/coupon', customerCouponRouter);
app.use('/api/admin/referral-settings', adminReferralSettingsRouter);
app.use('/api/customer/referral', customerReferralRouter);
app.use('/api/admin/referrals', adminReferralTrackingRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', customerPaymentRouter);
app.use('/api/admin', adminPaymentRouter);
app.use('/api/customer/orders', customerOrderRouter);
app.use('/api/admin/orders', adminOrderRouter);
app.use('/api/admin/inventory', adminInventoryRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/customers', adminCustomerRouter);
app.use('/api/admin/banners', adminBannerRouter);
app.use('/api/home', homeRouter);
app.use('/api/payment-settings', paymentSettingsRouter);
app.use('/api/cashfree', cashfreeRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;