require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyReferrals } = require('../controllers/referralsController');

// All routes require authentication
router.use(authenticate);

// Customer referral details
router.get('/me', getMyReferrals);

module.exports = router;
