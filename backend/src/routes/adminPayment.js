require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPendingPayments,
  approvePayment,
  rejectPayment
} = require('../controllers/adminPaymentController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// Payment verification
router.get('/payments/pending', getPendingPayments);
router.post('/payments/:paymentId/approve', approvePayment);
router.post('/payments/:paymentId/reject', rejectPayment);

module.exports = router;