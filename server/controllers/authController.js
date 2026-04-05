const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

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

// GET /api/auth/me  (Yêu cầu middleware xác thực)
exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
});

// POST /api/auth/logout
exports.logout = (req, res) => {
  return successResponse(res, HTTP_STATUS.OK, 'Đăng xuất thành công', null);
};
