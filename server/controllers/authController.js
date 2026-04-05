const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, 'Đăng ký tài khoản thành công', { user, token });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const { user, token } = await authService.loginUser(email, password, clientInfo);
    return successResponse(res, HTTP_STATUS.OK, 'Đăng nhập thành công', { user, token });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, error.message, error);
  }
};

// GET /api/auth/me  (Yêu cầu middleware xác thực)
exports.getMe = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  return successResponse(res, HTTP_STATUS.OK, 'Đăng xuất thành công', null);
};
