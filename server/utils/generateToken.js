const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../config/logger').child({ component: 'jwt' });

/**
 * Hàm tạo JWT Token với kiểm tra và xử lý lỗi đầy đủ
 * @param {String|Object} payload - Dữ liệu cần mã hóa (VD: userId hoặc object tùy ý)
 * @param {String} [expiresIn] - Thời gian sống của token (ghi đè config nếu có)
 * @returns {String} Chuỗi JWT token
 * @throws {Error} Nếu payload thiếu, secret không hợp lệ, hoặc lỗi khi ký token
 */
const generateToken = (payload, expiresIn) => {
  // 1. Kiểm tra payload
  if (payload === undefined || payload === null) {
    throw new Error('Payload không được để trống (null hoặc undefined)');
  }
  if (typeof payload !== 'string' && typeof payload !== 'object') {
    throw new Error('Payload phải là string hoặc object');
  }
  if (typeof payload === 'object' && Object.keys(payload).length === 0) {
    throw new Error('Payload object không được rỗng');
  }

  // 2. Xác thực cấu hình JWT Secret
  const secret = config.jwtSecret;
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT secret chưa được cấu hình hoặc không phải chuỗi');
  }
  if (secret.length < 32) {
    throw new Error('JWT secret phải có ít nhất 32 ký tự để đảm bảo an toàn');
  }

  // 3. Xác định thời gian hết hạn
  let finalExpiresIn = expiresIn || config.jwtExpire;
  if (!finalExpiresIn || typeof finalExpiresIn !== 'string') {
    // Fallback an toàn nếu không có trong config hoặc sai kiểu
    finalExpiresIn = '7d';
    logger.warn('Invalid jwtExpire configuration, falling back to default', {
      fallback: '7d',
      configuredValue: config.jwtExpire,
    });
  }

  // 4. Chuẩn hóa payload
  const normalizedPayload = typeof payload === 'string' ? { id: payload } : payload;

  // 5. Ký token kèm xử lý lỗi
  try {
    const token = jwt.sign(normalizedPayload, secret, { expiresIn: finalExpiresIn });
    return token;
  } catch (error) {
    // Ghi log chi tiết lỗi (không lộ secret)
    logger.error('JWT signing failed', { error: error.message });
    // Throw lỗi chung để module gọi xử lý tiếp
    throw new Error(`Không thể tạo JWT token: ${error.message}`);
  }
};

/**
 * Tạo Refresh Token (thời hạn dài, dùng secret riêng)
 * @param {String} userId
 * @returns {String} Chuỗi JWT refresh token
 */
const generateRefreshToken = (userId) => {
  if (!userId) throw new Error('userId không được để trống');

  const secret = config.jwtRefreshSecret;
  if (!secret || typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT refresh secret chưa được cấu hình hoặc không đủ mạnh');
  }

  let expiresIn = config.jwtRefreshExpire;
  if (!expiresIn || typeof expiresIn !== 'string') {
    expiresIn = '30d';
    logger.warn('Invalid jwtRefreshExpire configuration, falling back to 30d');
  }

  try {
    return jwt.sign({ id: userId }, secret, { expiresIn });
  } catch (error) {
    logger.error('JWT refresh token signing failed', { error: error.message });
    throw new Error(`Không thể tạo refresh token: ${error.message}`);
  }
};

module.exports = { generateToken, generateRefreshToken };