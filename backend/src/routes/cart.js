require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  addToCart,
  updateCartItem,
  removeCartItem,
  getCart
} = require('../controllers/cartController');

// All routes require authentication
router.use(authenticate);

// Cart operations
router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);

module.exports = router;