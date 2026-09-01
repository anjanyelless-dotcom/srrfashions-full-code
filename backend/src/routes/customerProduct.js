require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById
} = require('../controllers/customerProductController');

// Public routes - no authentication required
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;