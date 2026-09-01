require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAddresses
} = require('../controllers/addressController');

// All routes require authentication
router.use(authenticate);

// Address operations
router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;