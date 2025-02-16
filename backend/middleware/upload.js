// middlewares/upload.js
const multer = require('multer');

// // Set up Multer storage configuration
// const storage = multer.diskStorage({
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname); // Unique file name
//   },
// });

// // Set up Cloudinary storage for Multer
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//       folder: 'uploads', // Folder name in Cloudinary
//       allowed_formats: ['jpg', 'jpeg', 'png']
//   }
// });

const storage = multer.memoryStorage(); 

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
