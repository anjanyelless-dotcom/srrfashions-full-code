require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../storage/storageAdapter');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductImages,
  deleteProductImage,
  reorderProductImages,
  getAllProducts,
  getProductById
} = require('../controllers/adminProductController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// CRUD operations
router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Status management
router.patch('/:id/status', updateProductStatus);

// Image management
router.post('/:id/images', upload.array('images', 10), uploadProductImages);
router.delete('/:id/images/:imageId', deleteProductImage);
router.put('/:id/images/order', reorderProductImages);

module.exports = router;