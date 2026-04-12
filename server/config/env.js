// config/env.js
const dotenv = require('dotenv');
const path = require('path');

// Load file .env từ thư mục gốc
dotenv.config({ path: path.join(__dirname, '../.env') });

// Danh sách biến môi trường bắt buộc
const requiredEnv = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',   
  'CLOUDINARY_API_KEY',      
  'CLOUDINARY_API_SECRET',   
];

// Kiểm tra các biến bắt buộc
const missingEnv = requiredEnv.filter(envVar => !process.env[envVar]);
if (missingEnv.length > 0) {
  console.error(`❌ Thiếu biến môi trường: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// Export cấu hình
module.exports = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE, // ví dụ: '30d'
  resetPasswordTokenExpireMinutes: parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES || '1', 10),
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    fromName: process.env.EMAIL_FROM_NAME || 'Glass Store',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};