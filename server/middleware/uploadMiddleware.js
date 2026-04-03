const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Import file cấu hình cloudinary của bạn

// Cấu hình storage đẩy trực tiếp lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'GlassStore_Uploads', // Tên thư mục sẽ tạo trên Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Thay thế cho hàm fileFilter cũ
    // public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0], // Tùy chọn đặt tên file
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

module.exports = upload;


// // middleware/uploadMiddleware.js
// const multer = require('multer');
// const path = require('path');

// // Cấu hình multer để lưu tạm file vào bộ nhớ (hoặc disk)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // thư mục tạm
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// // Kiểm tra loại file
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp)'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: fileFilter
// });

// module.exports = upload;