require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllReferrals,
  disableReferral,
  approveReward,
  rejectReward
} = require('../controllers/adminReferralTrackingController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// Referral tracking
router.get('/', getAllReferrals);
router.patch('/:id/disable', disableReferral);

// Reward management
router.patch('/referral-rewards/:id/approve', approveReward);
router.patch('/referral-rewards/:id/reject', rejectReward);

module.exports = router;