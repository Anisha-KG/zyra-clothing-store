const multer = require('multer');
const fs = require('fs');
const path = require('path');

const allowedMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
];

// Storage configuration for category images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = './public/uploads/categories';
    // Create folder if it doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Only .png, .jpeg, .jpg, .gif, or .webp files are allowed'),
      false
    );
  }
};

// Export the multer instance for category uploads
const uploadCategory = multer({ storage, fileFilter });

module.exports = uploadCategory;
