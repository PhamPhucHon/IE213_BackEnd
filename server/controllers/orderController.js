const orderService = require('../services/orderService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  const order = await orderService.createOrder(req.user._id, shippingAddress, paymentMethod);
  return successResponse(res, HTTP_STATUS.CREATED, 'Đặt hàng thành công', order);
});

// GET /api/orders
exports.getUserOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
  const result = await orderService.getUserOrders(req.user._id, page, limit);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.orders, {}, result.pagination);
});

// GET /api/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user._id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, order);
});

// PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);
  return successResponse(res, HTTP_STATUS.OK, 'Hủy đơn hàng thành công', order);
});
