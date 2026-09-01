require('dotenv-flow/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');

// Ensure upload directory exists
if (STORAGE_TYPE === 'local') {
  const dirs = [
    path.join(UPLOAD_DIR, 'categories'),
    path.join(UPLOAD_DIR, 'products'),
    path.join(UPLOAD_DIR, 'banners'),
    path.join(UPLOAD_DIR, 'payments')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Save an in-memory file (multer buffer) to disk and return a relative path
const uploadFile = async (file, folder = '') => {
  if (STORAGE_TYPE === 'cloud') {
    // Cloud upload not implemented; treat as local for now
    throw new Error('Cloud storage upload is not configured');
  }

  const targetDir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname) || '.png';
  const filename = file.fieldname + '-' + uniqueSuffix + ext;
  const fullPath = path.join(targetDir, filename);

  await new Promise((resolve, reject) => {
    fs.writeFile(fullPath, file.buffer, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const relativePath = folder ? `${folder}/${filename}` : filename;
  return getFileUrl(filename, folder);
};

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = req.uploadPath || UPLOAD_DIR;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Cloud storage configuration (placeholder for future implementation)
const cloudStorage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Get storage configuration based on environment
const getStorage = () => {
  if (STORAGE_TYPE === 'cloud') {
    return cloudStorage;
  }
  return localStorage;
};

// Multer upload configuration
const upload = multer({
  storage: getStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Get file URL based on storage type
const getFileUrl = (filename, folder = '') => {
  if (STORAGE_TYPE === 'cloud') {
    // Return cloud URL (implement based on cloud provider)
    return `${process.env.CLOUD_STORAGE_URL}/${folder}/${filename}`;
  }
  // Return local URL
  const relativePath = folder ? `${folder}/${filename}` : filename;
  return `/uploads/${relativePath}`;
};

// Delete file based on storage type
const deleteFile = async (filePath) => {
  try {
    if (!filePath) return;
    if (STORAGE_TYPE === 'local') {
      const relative = filePath.replace(/^\/?uploads\//, '').replace(/^\//, '');
      const fullPath = path.join(UPLOAD_DIR, relative);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } else {
      // Implement cloud file deletion
      // await cloudStorage.deleteFile(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

module.exports = {
  upload,
  getFileUrl,
  deleteFile,
  uploadFile,
  STORAGE_TYPE
};