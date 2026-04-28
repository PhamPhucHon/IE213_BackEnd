const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const TokenBlacklist = require('../models/TokenBlacklist');
const { generateToken } = require('../utils/generateToken');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');
const config = require('../config/env');

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
exports.logout = asyncHandler(async (req, res) => {
  const blacklistPromises = [];

  // Blacklist access token
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      blacklistPromises.push(
        TokenBlacklist.create({ token, expiresAt: new Date(decoded.exp * 1000) })
      );
    } catch {
      // Token đã hết hạn hoặc không hợp lệ — không cần blacklist
    }
  }

  // Blacklist refresh token nếu có
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
      blacklistPromises.push(
        TokenBlacklist.create({ token: refreshToken, expiresAt: new Date(decoded.exp * 1000) })
      );
    } catch {
      // Refresh token đã hết hạn hoặc không hợp lệ — không cần blacklist
    }
  }

  await Promise.allSettled(blacklistPromises);

  return successResponse(res, HTTP_STATUS.OK, 'Đăng xuất thành công', null);
});

// POST /api/auth/refresh-token
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'refreshToken là bắt buộc' });
  }

  // Kiểm tra blacklist
  const isBlacklisted = await TokenBlacklist.findOne({ token: refreshToken });
  if (isBlacklisted) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Refresh token đã bị vô hiệu hóa' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }

  const newToken = generateToken(decoded.id);

  return successResponse(res, HTTP_STATUS.OK, 'Làm mới token thành công', { token: newToken });
});
