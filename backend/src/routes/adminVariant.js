require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  addVariant,
  updateVariant,
  deleteVariant,
  getVariantsByProduct
} = require('../controllers/adminVariantController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// Variant operations for specific product
router.post('/products/:id/variants', addVariant);
router.get('/products/:id/variants', getVariantsByProduct);

// Individual variant operations
router.put('/variants/:variantId', updateVariant);
router.delete('/variants/:variantId', deleteVariant);

module.exports = router;