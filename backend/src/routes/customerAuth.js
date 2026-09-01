require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  customerRegister,
  customerLogin,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/customerAuthController');

// Public routes
router.post('/register', customerRegister);
router.post('/login', customerLogin);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;