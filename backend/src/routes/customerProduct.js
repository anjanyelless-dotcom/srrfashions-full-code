require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductBySlug
} = require('../controllers/customerProductController');

// Public routes - no authentication required
router.get('/', getProducts);
// Slug-based route must come before ID-based route to avoid conflicts
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

module.exports = router;