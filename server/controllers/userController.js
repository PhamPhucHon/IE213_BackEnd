const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user._id);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = await userService.updateUserProfile(req.user._id, req.body);
    return successResponse(res, HTTP_STATUS.OK, 'Cập nhật thông tin thành công', updatedUser);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changeUserPassword(req.user._id, currentPassword, newPassword);
    return successResponse(res, HTTP_STATUS.OK, result.message, null);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// POST /api/users/addresses
exports.addAddress = async (req, res) => {
  try {
    const addresses = await userService.addAddress(req.user._id, req.body);
    return successResponse(res, HTTP_STATUS.CREATED, 'Thêm địa chỉ thành công', addresses);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// PUT /api/users/addresses/:addressId
exports.updateAddress = async (req, res) => {
  try {
    const addresses = await userService.updateAddress(req.user._id, req.params.addressId, req.body);
    return successResponse(res, HTTP_STATUS.OK, 'Cập nhật địa chỉ thành công', addresses);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// DELETE /api/users/addresses/:addressId
exports.deleteAddress = async (req, res) => {
  try {
    const addresses = await userService.deleteAddress(req.user._id, req.params.addressId);
    return successResponse(res, HTTP_STATUS.OK, 'Xóa địa chỉ thành công', addresses);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// PUT /api/users/addresses/:addressId/set-default
exports.setDefaultAddress = async (req, res) => {
  try {
    const addresses = await userService.setDefaultAddress(req.user._id, req.params.addressId);
    return successResponse(res, HTTP_STATUS.OK, 'Đã đặt làm địa chỉ mặc định', addresses);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};
