require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  getCategoryProducts,
  getCategoryBySlug,
  getCategoryProductsBySlug
} = require('../controllers/customerCategoryController');

// Public routes - no authentication required
router.get('/', getCategories);
// Slug-based routes must come before ID-based routes to avoid conflicts
router.get('/slug/:slug', getCategoryBySlug);
router.get('/slug/:slug/products', getCategoryProductsBySlug);
router.get('/:id', getCategoryById);
router.get('/:id/products', getCategoryProducts);

module.exports = router;