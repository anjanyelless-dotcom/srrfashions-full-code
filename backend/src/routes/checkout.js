require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrder
} = require('../controllers/checkoutController');

// All routes require authentication
router.use(authenticate);

// Checkout operations
router.post('/', createOrder);

module.exports = router;