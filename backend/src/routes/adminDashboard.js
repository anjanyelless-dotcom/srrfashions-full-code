require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getDashboard } = require('../controllers/adminDashboardController');

// Route requires authentication and admin role
router.get('/', authenticate, authorize('ADMIN'), getDashboard);

module.exports = router;
