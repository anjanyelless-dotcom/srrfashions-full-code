require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAdminOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  cancelAdminOrder
} = require('../controllers/adminOrderController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

router.get('/', getAdminOrders);
router.get('/:id', getAdminOrderDetail);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelAdminOrder);

module.exports = router;