const multer = require('multer');
const { HTTP_STATUS, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } = require('../config/constants');
const { errorResponse } = require('../utils/apiResponse');

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new Error('Chi chap nhan file anh: jpeg, jpg, png, webp, avif'));
  }
  return cb(null, true);
};

// Keep the upload in memory so the service can choose Cloudinary or local storage.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

/**
 * Chuẩn hóa lỗi upload từ multer/cloudinary
 */
const handleUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Kích thước file vượt quá giới hạn ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
      );
    }
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, `Lỗi upload: ${err.message}`);
  }

  return errorResponse(res, HTTP_STATUS.BAD_REQUEST, err.message || 'Upload thất bại');
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
module.exports.uploadSingle = (fieldName = 'image') => upload.single(fieldName);
module.exports.uploadArray = (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount);


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
