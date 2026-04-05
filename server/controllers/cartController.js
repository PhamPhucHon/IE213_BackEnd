const cartService = require('../services/cartService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, cart);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};

// POST /api/cart
exports.addToCart = async (req, res) => {
  try {
    const cart = await cartService.addToCart(req.user._id, req.body);
    return successResponse(res, HTTP_STATUS.OK, 'Thêm sản phẩm vào giỏ hàng thành công', cart);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// PUT /api/cart/:sku
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user._id, req.params.sku, quantity);
    return successResponse(res, HTTP_STATUS.OK, 'Cập nhật giỏ hàng thành công', cart);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// DELETE /api/cart/:sku
exports.removeCartItem = async (req, res) => {
  try {
    const cart = await cartService.removeCartItem(req.user._id, req.params.sku);
    return successResponse(res, HTTP_STATUS.OK, 'Đã xóa sản phẩm khỏi giỏ hàng', cart);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user._id);
    return successResponse(res, HTTP_STATUS.OK, 'Đã xóa toàn bộ giỏ hàng', cart);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};
