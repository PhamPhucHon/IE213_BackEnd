const User = require('../models/User');
const userService = require('../services/userService');
const orderService = require('../services/orderService');
const inventoryService = require('../services/inventoryService');
const reviewService = require('../services/reviewService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');
const { asyncHandler, AppError } = require('../utils/asyncHandler');

// ==================== QUẢN LÝ NGƯỜI DÙNG ====================

// GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
  const result = await userService.getAllUsers(page, limit, { includeInactive: true });

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.users, {}, result.pagination);
});

// GET /api/admin/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).setOptions({ includeInactive: true });
  if (!user) throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
});

// PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).setOptions({ includeInactive: true });
  if (!user) throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  user.isActive = !user.isActive;
  await user.save();

  const statusText = user.isActive ? 'kích hoạt' : 'vô hiệu hóa';
  return successResponse(res, HTTP_STATUS.OK, `Đã ${statusText} tài khoản thành công`, user);
});

// ==================== QUẢN LÝ ĐƠN HÀNG ====================

// GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
  const result = await orderService.getAllOrders(page, limit, req.query.status);

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.orders, {}, result.pagination);
});

// GET /api/admin/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  // Truyền userId = null để bỏ qua kiểm tra quyền sở hữu
  const order = await orderService.getOrderById(req.params.id, null);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, order);
});

// PUT /api/admin/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, true);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật trạng thái đơn hàng thành công', order);
});

// ==================== QUẢN LÝ KHO ====================

// GET /api/admin/inventory
exports.getInventoryList = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(Number(req.query.limit) || 20, PAGINATION.MAX_LIMIT);
  const { productId, lowStock } = req.query;

  const result = await inventoryService.listInventory({ productId, lowStock, page, limit });

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.inventories, {}, result.pagination);
});

// GET /api/admin/inventory/:sku
exports.getInventoryBySku = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getStock(req.params.sku);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, inventory);
});

// PUT /api/admin/inventory/:sku
exports.updateInventory = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const inventory = await inventoryService.updateStock(req.params.sku, stock);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật tồn kho thành công', inventory);
});

// ==================== QUẢN LÝ ĐÁNH GIÁ ====================

// DELETE /api/admin/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id, req.user._id, true);
  return successResponse(res, HTTP_STATUS.OK, result.message, null);
});
