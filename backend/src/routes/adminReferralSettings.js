require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getReferralSettings,
  updateReferralSettings
} = require('../controllers/adminReferralSettingsController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// Referral settings CRUD
router.get('/', getReferralSettings);
router.put('/', updateReferralSettings);

module.exports = router;