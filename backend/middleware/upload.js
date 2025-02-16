// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
;
// Set up Multer storage configuration
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique file name
  },
});

// Multer upload middleware
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("File must be an image"));
        }
        cb(null, true);
    } 
});

module.exports = upload;
