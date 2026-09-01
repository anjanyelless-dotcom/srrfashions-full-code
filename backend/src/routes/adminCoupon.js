require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  updateCouponStatus,
  getAllCoupons
} = require('../controllers/adminCouponController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// CRUD operations
router.post('/', createCoupon);
router.get('/', getAllCoupons);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

// Status management
router.patch('/:id/status', updateCouponStatus);

module.exports = router;