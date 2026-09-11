require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getActiveOffers,
  getOffersEligibility,
  applyOffer
} = require('../controllers/offersController');

// Public route - no authentication required
router.get('/', getActiveOffers);

// Authenticated routes
router.get('/eligibility', authenticate, getOffersEligibility);
router.post('/apply', authenticate, applyOffer);

module.exports = router;
