const User = require('../models/User');
const Order = require('../models/Order');
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
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, users, {}, {
    totalUsers: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  });
});

// GET /api/admin/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
});

// PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
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
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
  ]);

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, orders, {}, {
    totalOrders: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  });
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
