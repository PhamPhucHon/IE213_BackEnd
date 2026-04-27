const userService = require('../services/userService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
});

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserProfile(req.user._id, req.body);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật thông tin thành công', updatedUser);
});

// PUT /api/users/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changeUserPassword(req.user._id, currentPassword, newPassword);
  return successResponse(res, HTTP_STATUS.OK, result.message, null);
});

// POST /api/users/addresses
exports.addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddress(req.user._id, req.body);
  return successResponse(res, HTTP_STATUS.CREATED, 'Thêm địa chỉ thành công', addresses);
});

// PUT /api/users/addresses/:addressId
exports.updateAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.updateAddress(req.user._id, req.params.addressId, req.body);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật địa chỉ thành công', addresses);
});

// DELETE /api/users/addresses/:addressId
exports.deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.deleteAddress(req.user._id, req.params.addressId);
  return successResponse(res, HTTP_STATUS.OK, 'Xóa địa chỉ thành công', addresses);
});

// PUT /api/users/addresses/:addressId/set-default
exports.setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.setDefaultAddress(req.user._id, req.params.addressId);
  return successResponse(res, HTTP_STATUS.OK, 'Đã đặt làm địa chỉ mặc định', addresses);
});

// GET /api/users/addresses
exports.getAddresses = asyncHandler(async (req, res) => {
  const addresses = await userService.getAddresses(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, 'Lấy danh sách địa chỉ thành công', addresses);
});

// DELETE /api/users/me
exports.deleteOwnAccount = asyncHandler(async (req, res) => {
  await userService.deleteOwnAccount(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, 'Tài khoản đã được xóa (vô hiệu hóa)');
});