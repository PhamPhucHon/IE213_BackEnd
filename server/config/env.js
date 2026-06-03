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
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRE',
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

const parseTrustProxy = (value) => {
  if (!value || value === 'false' || value === '0') {
    return false;
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  if (value === 'true') {
    return 1;
  }

  return value;
};

// Export cấu hình
module.exports = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE,
  resetPasswordTokenExpireMinutes: parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES || '1', 10),
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    fromName: process.env.EMAIL_FROM_NAME || 'Glass Store',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  upload: {
    cloudinaryTimeoutMs: parseInt(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || '4000', 10),
  },
  dnsServers: (process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
    requestLoggingEnabled: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    sinkUrl: process.env.LOG_SINK_URL || '',
    sinkAuthToken: process.env.LOG_SINK_AUTH_TOKEN || '',
  },
};
