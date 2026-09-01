require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { getOrder, getPaymentStatus, handleWebhook } = require('../controllers/cashfreeController');

router.get('/orders/:orderId', getOrder);
router.get('/orders/:orderId/status', getPaymentStatus);
router.post('/webhook', handleWebhook);

module.exports = router;