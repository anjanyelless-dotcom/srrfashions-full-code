require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getReferralInfo
} = require('../controllers/customerReferralController');

// All routes require authentication
router.use(authenticate);

// Customer referral operations
router.get('/', getReferralInfo);

module.exports = router;