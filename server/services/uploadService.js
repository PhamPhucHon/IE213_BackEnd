const { optimizeImageUrl } = require('../utils/imageUrl');
const { AppError } = require('../utils/asyncHandler');

const uploadImageResult = (file) => {
  if (!file) {
    throw new AppError('Image file is required.', 400);
  }

  const imageUrl = optimizeImageUrl(file.path || file.secure_url || file.url);
  if (!imageUrl) {
    throw new AppError('Uploaded image did not return a URL.', 500);
  }

  return {
    imageUrl,
    publicId: file.filename || file.public_id,
    format: 'webp',
    optimized: true,
  };
};

module.exports = {
  uploadImageResult,
};
