require('dotenv-flow/config');
const express = require('express');
const path = require('path');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../storage/storageAdapter');
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus
} = require('../controllers/adminBannerController');

// All routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');

const setBannerUploadPath = (req, res, next) => {
  req.uploadPath = path.join(UPLOAD_DIR, 'banners');
  next();
};

router.get('/', getBanners);
router.post('/', setBannerUploadPath, upload.single('image'), createBanner);
router.put('/:id', setBannerUploadPath, upload.single('image'), updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/status', updateBannerStatus);

module.exports = router;
