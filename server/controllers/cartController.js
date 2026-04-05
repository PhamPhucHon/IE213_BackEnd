const cartService = require('../services/cartService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, cart);
});

// POST /api/cart
exports.addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user._id, req.body);
  return successResponse(res, HTTP_STATUS.OK, 'Thêm sản phẩm vào giỏ hàng thành công', cart);
});

// PUT /api/cart/:sku
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(req.user._id, req.params.sku, quantity);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật giỏ hàng thành công', cart);
});

// DELETE /api/cart/:sku
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user._id, req.params.sku);
  return successResponse(res, HTTP_STATUS.OK, 'Đã xóa sản phẩm khỏi giỏ hàng', cart);
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  return successResponse(res, HTTP_STATUS.OK, 'Đã xóa toàn bộ giỏ hàng', cart);
});
