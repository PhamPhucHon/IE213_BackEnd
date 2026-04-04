const reviewService = require('../services/reviewService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION, REVIEW_LIMIT } = require('../config/constants');

// POST /api/products/:productId/reviews
exports.createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.params.productId, req.body);
    return successResponse(res, HTTP_STATUS.CREATED, 'Đánh giá sản phẩm thành công', review);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// GET /api/products/:productId/reviews
exports.getReviewsByProduct = async (req, res) => {
  try {
    const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Number(req.query.limit) || REVIEW_LIMIT;
    const ratingFilter = req.query.rating || 'all';
    const result = await reviewService.getReviewsByProduct(req.params.productId, page, limit, ratingFilter);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.reviews, {}, result.pagination);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};

// PUT /api/reviews/:id
exports.updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);
    return successResponse(res, HTTP_STATUS.OK, 'Cập nhật đánh giá thành công', review);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const result = await reviewService.deleteReview(req.params.id, req.user._id, false);
    return successResponse(res, HTTP_STATUS.OK, result.message, null);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// POST /api/reviews/:id/like
exports.likeReview = async (req, res) => {
  try {
    const result = await reviewService.likeReview(req.params.id, req.user._id);
    return successResponse(res, HTTP_STATUS.OK, result.message, { likes: result.likes });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};
