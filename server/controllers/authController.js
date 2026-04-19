const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const TokenBlacklist = require('../models/TokenBlacklist');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');
const config = require('../config/env');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  return successResponse(res, HTTP_STATUS.CREATED, 'Đăng ký tài khoản thành công', { user, token });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientInfo = {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
  const { user, token } = await authService.loginUser(email, password, clientInfo);
  return successResponse(res, HTTP_STATUS.OK, 'Đăng nhập thành công', { user, token });
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
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const expiresAt = new Date(decoded.exp * 1000);
      await TokenBlacklist.create({ token, expiresAt });
    } catch {
      // Token đã hết hạn hoặc không hợp lệ — không cần blacklist
    }
  }
  return successResponse(res, HTTP_STATUS.OK, 'Đăng xuất thành công', null);
});
