require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const storage = require('../storage/storageAdapter');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const {
  submitPayment,
  resubmitPayment
} = require('../controllers/customerPaymentController');

// All routes require authentication
router.use(authenticate);

// Payment submission
router.post('/:orderId/payment/submit', upload.single('screenshot'), submitPayment);
router.post('/:orderId/payment/resubmit', upload.single('screenshot'), resubmitPayment);

module.exports = router;