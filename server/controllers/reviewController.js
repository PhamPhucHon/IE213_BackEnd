const reviewService = require('../services/reviewService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION, REVIEW_LIMIT } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// POST /api/products/:productId/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.params.productId, req.body);
  return successResponse(res, HTTP_STATUS.CREATED, 'Đánh giá sản phẩm thành công', review);
});

// GET /api/products/:productId/reviews
exports.getReviewsByProduct = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Number(req.query.limit) || REVIEW_LIMIT;
  const ratingFilter = req.query.rating || 'all';
  const result = await reviewService.getReviewsByProduct(req.params.productId, page, limit, ratingFilter);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.reviews, {}, result.pagination);
});

// PUT /api/reviews/:id
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật đánh giá thành công', review);
});

// DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id, req.user._id, false);
  return successResponse(res, HTTP_STATUS.OK, result.message, null);
});

// POST /api/reviews/:id/like
exports.likeReview = asyncHandler(async (req, res) => {
  const result = await reviewService.likeReview(req.params.id, req.user._id);
  return successResponse(res, HTTP_STATUS.OK, result.message, { likes: result.likes });
});
