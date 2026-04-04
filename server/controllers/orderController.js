const orderService = require('../services/orderService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const order = await orderService.createOrder(req.user._id, shippingAddress, paymentMethod);
    return successResponse(res, HTTP_STATUS.CREATED, 'Đặt hàng thành công', order);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// GET /api/orders
exports.getUserOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const result = await orderService.getUserOrders(req.user._id, page, limit);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.orders, {}, result.pagination);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, order);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user._id);
    return successResponse(res, HTTP_STATUS.OK, 'Hủy đơn hàng thành công', order);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};
