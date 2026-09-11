const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCampaigns,
  getCampaignById,
  createCampaign,
  getRecipients,
  sendCampaign,
  sendTestSms,
  webhookDelivery
} = require('../controllers/smsController');

router.get('/campaigns', authenticate, authorize('ADMIN'), getCampaigns);
router.get('/campaigns/:id', authenticate, authorize('ADMIN'), getCampaignById);
router.post('/campaigns', authenticate, authorize('ADMIN'), createCampaign);
router.get('/recipients', authenticate, authorize('ADMIN'), getRecipients);
router.post('/campaigns/:id/send', authenticate, authorize('ADMIN'), sendCampaign);
router.post('/test', authenticate, authorize('ADMIN'), sendTestSms);
router.post('/webhooks/smslocal', webhookDelivery);

module.exports = router;
