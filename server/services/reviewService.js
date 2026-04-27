const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const productService = require('./productService');
const { reviewDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

/**
 * Tạo đánh giá mới
 * @param {String} userId - ID người dùng
 * @param {String} productId - ID sản phẩm
 * @param {Object} reviewData - Dữ liệu đánh giá (rating, comment, title, images...)
 */
exports.createReview = async (userId, productId, reviewData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingReview = await Review.findOne({ productId, userId }).session(session);
    if (existingReview) {
      throw new AppError('Bạn đã đánh giá sản phẩm này rồi.', 409);
    }

    const hasBought = await Order.findOne({
      userId: userId,
      status: 'Delivered',
      'items.productId': productId
    }).session(session);

    const user = await User.findById(userId).session(session);

    const [review] = await Review.create([{
      productId,
      userId,
      userName: user.name,
      userAvatar: user.avatar || '',
      rating: reviewData.rating,
      title: reviewData.title || '',
      comment: reviewData.comment,
      images: reviewData.images || [],
      isVerifiedPurchase: !!hasBought,
      isApproved: true
    }], { session });

    await productService.updateRatingStats(productId, session);
    await session.commitTransaction();

    return reviewDTO(review);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Lấy danh sách đánh giá của sản phẩm (Phân trang, lọc theo sao)
 * @param {String} productId 
 * @param {Number} page 
 * @param {Number} limit 
 * @param {Number|String} ratingFilter - Số sao để lọc (1, 2, 3, 4, 5) hoặc 'all'
 */
exports.getReviewsByProduct = async (productId, page = 1, limit = 5, ratingFilter = 'all') => {
  const query = { productId, isApproved: true };

  // Thêm điều kiện lọc theo sao nếu có
  if (ratingFilter !== 'all' && !isNaN(ratingFilter)) {
    query.rating = Number(ratingFilter);
  }

  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    Review.find(query)
      .sort({ createdAt: -1 }) // Mới nhất xếp trước
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(query)
  ]);

  return {
    reviews: reviews.map(reviewDTO),
    pagination: {
      totalReviews,
      currentPage: Number(page),
      totalPages: Math.ceil(totalReviews / limit),
      limit: Number(limit)
    }
  };
};

/**
 * Cập nhật đánh giá (Chỉ dành cho chủ sở hữu)
 */
exports.updateReview = async (reviewId, userId, updateData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const review = await Review.findById(reviewId).session(session);
    if (!review) throw new AppError('Không tìm thấy đánh giá.', 404);
    if (review.userId.toString() !== userId.toString()) {
      throw new AppError('Bạn không có quyền chỉnh sửa đánh giá này.', 403);
    }

    if (updateData.rating !== undefined) review.rating = updateData.rating;
    if (updateData.title !== undefined) review.title = updateData.title;
    if (updateData.comment !== undefined) review.comment = updateData.comment;
    if (updateData.images !== undefined) review.images = updateData.images;

    await review.save({ session });

    if (updateData.rating !== undefined) {
      await productService.updateRatingStats(review.productId, session);
    }

    await session.commitTransaction();

    return reviewDTO(review);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Xóa đánh giá (Dành cho chủ sở hữu hoặc Admin)
 */
exports.deleteReview = async (reviewId, userId, isAdmin = false) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const review = await Review.findById(reviewId).session(session);
    if (!review) throw new AppError('Không tìm thấy đánh giá.', 404);

    if (!isAdmin && review.userId.toString() !== userId.toString()) {
      throw new AppError('Bạn không có quyền xóa đánh giá này.', 403);
    }

    const productId = review.productId;

    await Review.findByIdAndDelete(reviewId).session(session);
    await productService.updateRatingStats(productId, session);

    await session.commitTransaction();

    return { message: 'Đã xóa đánh giá thành công.' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Thích hoặc bỏ thích một đánh giá (Like / Unlike)
 */
exports.likeReview = async (reviewId, userId) => {
  // Bước 1: thử unlike atomically nếu user đã like trước đó
  const unliked = await Review.findOneAndUpdate(
    { _id: reviewId, likedBy: userId },
    {
      $pull: { likedBy: userId },
      $inc: { likes: -1 },
    },
    { returnDocument: 'after' }
  );

  if (unliked) {
    return {
      message: 'Đã bỏ thích đánh giá',
      likes: Math.max(unliked.likes, 0),
    };
  }

  // Bước 2: nếu chưa like thì like atomically
  const liked = await Review.findOneAndUpdate(
    { _id: reviewId, likedBy: { $ne: userId } },
    {
      $addToSet: { likedBy: userId },
      $inc: { likes: 1 },
    },
    { returnDocument: 'after' }
  );

  if (liked) {
    return {
      message: 'Đã thích đánh giá',
      likes: liked.likes,
    };
  }

  // Fallback cho race condition hiếm: kiểm tra trạng thái cuối cùng của review
  const latest = await Review.findById(reviewId).select('likes likedBy');
  if (!latest) throw new AppError('Không tìm thấy đánh giá.', 404);

  const hasLikedNow = latest.likedBy.some(id => id.toString() === userId.toString());
  return {
    message: hasLikedNow ? 'Đã thích đánh giá' : 'Đã bỏ thích đánh giá',
    likes: Math.max(latest.likes, 0),
  };
};