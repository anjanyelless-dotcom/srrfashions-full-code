require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCustomerOrders,
  getCustomerOrderDetail,
  cancelCustomerOrder,
  getPaymentStatus
} = require('../controllers/customerOrderController');

// All routes require authentication
router.use(authenticate);

router.get('/', getCustomerOrders);
router.get('/:id', getCustomerOrderDetail);
router.get('/:id/payment-status', getPaymentStatus);
router.patch('/:id/cancel', cancelCustomerOrder);

module.exports = router;