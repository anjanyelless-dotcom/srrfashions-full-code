require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../storage/storageAdapter');
const {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  uploadCategoryImage,
  updateCategoryOrder,
  getAllCategories
} = require('../controllers/adminCategoryController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// CRUD operations
router.post('/', createCategory);
router.get('/', getAllCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Status and image management
router.patch('/:id/status', updateCategoryStatus);
router.post('/:id/image', upload.single('image'), uploadCategoryImage);
router.put('/:id/order', updateCategoryOrder);

module.exports = router;