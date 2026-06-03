const crypto = require('crypto');
const config = require('../config/env');
const { optimizeImageUrl } = require('../utils/imageUrl');
const { AppError } = require('../utils/asyncHandler');

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const cloudinaryFolder = 'GlassStore_Uploads';
const configuredTimeoutMs = config.upload.cloudinaryTimeoutMs;
const cloudinaryTimeoutMs = Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
  ? configuredTimeoutMs
  : 4000;

const getUploadUrl = () =>
  `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;

const signCloudinaryParams = (params) => {
  const signaturePayload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${signaturePayload}${config.cloudinary.apiSecret}`)
    .digest('hex');
};

const buildCloudinaryFormData = (file) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = {
    folder: cloudinaryFolder,
    timestamp,
  };
  const formData = new FormData();

  formData.append('file', new Blob([file.buffer], {
    type: file.mimetype || 'application/octet-stream',
  }), file.originalname || 'upload');
  formData.append('api_key', config.cloudinary.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', cloudinaryFolder);
  formData.append('signature', signCloudinaryParams(signedParams));

  return formData;
};

const uploadToCloudinary = async (file) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cloudinaryTimeoutMs);

  try {
    const response = await fetch(getUploadUrl(), {
      method: 'POST',
      body: buildCloudinaryFormData(file),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || 'Cloudinary rejected the image upload.';
      if (response.status === 401 || response.status === 403 || /missing permissions|forbidden/i.test(message)) {
        throw new AppError(
          'Cloudinary upload credentials do not have permission to create images.',
          403
        );
      }

      throw new AppError(message, 502);
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new AppError('Cloudinary upload timed out. Please try again.', 504);
    }

    throw new AppError('Cannot upload image to Cloudinary right now. Please try again.', 502);
  } finally {
    clearTimeout(timeout);
  }
};

const buildCloudinaryResult = (result) => {
  const imageUrl = optimizeImageUrl(result?.secure_url || result?.url);
  if (!imageUrl) {
    throw new AppError('Uploaded image did not return a URL.', 502);
  }

  return {
    imageUrl,
    publicId: result.public_id,
    format: result.format || 'webp',
    optimized: true,
  };
};

const uploadImageResult = async (file) => {
  if (!file) {
    throw new AppError('Image file is required.', 400);
  }

  const extension = (file.originalname || '').split('.').pop()?.toLowerCase();
  if (extension && !allowedFormats.includes(extension)) {
    throw new AppError('Only JPG, PNG, WEBP, and AVIF images are allowed.', 415);
  }

  const cloudinaryResult = await uploadToCloudinary(file);
  return buildCloudinaryResult(cloudinaryResult);
};

module.exports = {
  uploadImageResult,
};
