require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  adminLogin,
  changePassword
} = require('../controllers/adminAuthController');

// Public routes
router.post('/login', adminLogin);

// Protected routes (require authentication and admin role)
router.put('/change-password', authenticate, authorize('ADMIN'), changePassword);

module.exports = router;