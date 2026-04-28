const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');
const TokenBlacklist = require('../models/TokenBlacklist');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');
const config = require('../config/env');
const logger = require('../config/logger').child({ component: 'authController' });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { user, token, refreshToken } = await authService.registerUser(req.body);
  return successResponse(res, HTTP_STATUS.CREATED, 'Đăng ký tài khoản thành công', { user, token, refreshToken });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientInfo = {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
  const { user, token, refreshToken } = await authService.loginUser(email, password, clientInfo);
  return successResponse(res, HTTP_STATUS.OK, 'Đăng nhập thành công', { user, token, refreshToken });
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  return successResponse(res, HTTP_STATUS.OK, 'Email đặt lại mật khẩu đã được gửi', null);
});

// POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  return successResponse(res, HTTP_STATUS.OK, 'Đặt lại mật khẩu thành công', null);
});

// GET /api/auth/me  (Yêu cầu middleware xác thực)
exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
});

// POST /api/auth/logout
// Không dùng protect — cho phép cả access token hết hạn gọi được (vẫn blacklist refresh token)
exports.logout = asyncHandler(async (req, res) => {
  const blacklistPromises = [];

  // Blacklist access token (chấp nhận cả expired token)
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret, { ignoreExpiration: true });
      blacklistPromises.push(
        TokenBlacklist.create({ token, expiresAt: new Date(decoded.exp * 1000) })
          .catch(err => { if (err?.code !== 11000) throw err; }) // bỏ qua duplicate (token đã blacklist)
      );
    } catch {
      // Token không hợp lệ hoàn toàn — bỏ qua
    }
  }

  // Blacklist refresh token nếu có — validate owner trước khi blacklist
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);

      // Chỉ cho phép blacklist refresh token thuộc về chính user đang logout
      // (parse access token để lấy userId, kể cả expired)
      const accessHeader = req.headers?.authorization;
      if (accessHeader && accessHeader.startsWith('Bearer ')) {
        const accessToken = accessHeader.split(' ')[1];
        try {
          const accessDecoded = jwt.verify(accessToken, config.jwtSecret, { ignoreExpiration: true });
          if (decoded.id !== accessDecoded.id) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Refresh token không thuộc về tài khoản này');
          }
        } catch {
          // Access token không parse được — bỏ qua kiểm tra owner
        }
      }

      blacklistPromises.push(
        TokenBlacklist.create({ token: refreshToken, expiresAt: new Date(decoded.exp * 1000) })
          .catch(err => { if (err?.code !== 11000) throw err; })
      );
    } catch (err) {
      if (err.status === HTTP_STATUS.FORBIDDEN) throw err;
      // Refresh token hết hạn hoặc không hợp lệ — bỏ qua
    }
  }

  const results = await Promise.allSettled(blacklistPromises);
  results.forEach(r => {
    if (r.status === 'rejected') {
      logger.error('Blacklist token failed during logout', { error: r.reason?.message });
    }
  });

  return successResponse(res, HTTP_STATUS.OK, 'Đăng xuất thành công', null);
});

// POST /api/auth/refresh-token
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'refreshToken là bắt buộc');
  }

  // #1 Kiểm tra blacklist trước khi verify (tránh tốn chi phí crypto nếu đã revoke)
  const isBlacklisted = await TokenBlacklist.findOne({ token: refreshToken });
  if (isBlacklisted) {
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Refresh token đã bị vô hiệu hóa');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch {
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Refresh token không hợp lệ hoặc đã hết hạn');
  }

  // #2 Kiểm tra user vẫn tồn tại và chưa bị khóa
  const user = await User.findById(decoded.id).setOptions({ includeInactive: true });
  if (!user || !user.isActive) {
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Tài khoản không hợp lệ hoặc đã bị khóa');
  }

  // #3 Rotate: blacklist refresh token cũ, cấp cả cặp mới
  await TokenBlacklist.create({ token: refreshToken, expiresAt: new Date(decoded.exp * 1000) });

  const newToken = generateToken(user._id.toString());
  const newRefreshToken = generateRefreshToken(user._id.toString());

  return successResponse(res, HTTP_STATUS.OK, 'Làm mới token thành công', { token: newToken, refreshToken: newRefreshToken });
});
