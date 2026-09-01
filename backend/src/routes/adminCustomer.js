require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCustomers,
  getCustomerDetail,
  updateCustomerStatus
} = require('../controllers/adminCustomerController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

router.get('/', getCustomers);
router.get('/:id', getCustomerDetail);
router.patch('/:id/status', updateCustomerStatus);

module.exports = router;
