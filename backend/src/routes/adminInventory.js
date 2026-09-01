require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getInventory,
  updateVariantStock,
  getLowStock,
  getOutOfStock
} = require('../controllers/adminInventoryController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

router.get('/', getInventory);
router.put('/variants/:variantId/stock', updateVariantStock);
router.get('/low-stock', getLowStock);
router.get('/out-of-stock', getOutOfStock);

module.exports = router;
