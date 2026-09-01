require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  applyCoupon,
  removeCoupon,
  getAvailableCoupons
} = require('../controllers/customerCouponController');

// All routes require authentication
router.use(authenticate);

// Coupon operations
router.post('/apply', applyCoupon);
router.delete('/', removeCoupon);
router.get('/available', getAvailableCoupons);

module.exports = router;