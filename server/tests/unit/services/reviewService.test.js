jest.mock('../../../models/Review');
jest.mock('../../../models/Order');
jest.mock('../../../models/User');
jest.mock('../../../services/productService', () => ({
  updateRatingStats: jest.fn(),
}));
jest.mock('../../../utils/dto', () => ({
  reviewDTO: jest.fn((review) => ({ _id: review._id, rating: review.rating, likes: review.likes || 0 })),
}));

const mongoose = require('mongoose');
const Review = require('../../../models/Review');
const Order = require('../../../models/Order');
const User = require('../../../models/User');
const productService = require('../../../services/productService');
const reviewService = require('../../../services/reviewService');
const { createQueryMock, createSessionMock } = require('../utils/testHelpers');

describe('reviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession = jest.fn().mockResolvedValue(createSessionMock());
  });

  it('prevents duplicate reviews for the same product and user', async () => {
    Review.findOne.mockReturnValue(createQueryMock({ _id: 'review-dup' }));

    await expect(reviewService.createReview('user-1', 'product-1', { rating: 5 })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('creates verified purchase reviews and updates product rating stats', async () => {
    const session = createSessionMock();
    mongoose.startSession.mockResolvedValue(session);
    Review.findOne.mockReturnValue(createQueryMock(null));
    Order.findOne.mockReturnValue(createQueryMock({ _id: 'order-1' }));
    User.findById.mockReturnValue(createQueryMock({ name: 'John', avatar: 'avatar.png' }));
    Review.create.mockResolvedValue([{ _id: 'review-1', rating: 5, likes: 0 }]);

    const result = await reviewService.createReview('user-1', 'product-1', {
      rating: 5,
      comment: 'Great product',
      images: [],
    });

    expect(Review.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        productId: 'product-1',
        userId: 'user-1',
        userName: 'John',
        isVerifiedPurchase: true,
      })],
      { session }
    );
    expect(productService.updateRatingStats).toHaveBeenCalledWith('product-1', session);
    expect(result).toEqual({ _id: 'review-1', rating: 5, likes: 0 });
  });

  it('rejects review updates from non-owners', async () => {
    Review.findById.mockReturnValue(createQueryMock({ userId: { toString: () => 'other-user' } }));

    await expect(reviewService.updateReview('review-1', 'user-1', { rating: 4 })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('returns paginated approved reviews for a product', async () => {
    Review.find.mockReturnValue(createQueryMock([{ _id: 'review-1', rating: 5, likes: 1 }]));
    Review.countDocuments.mockResolvedValue(1);
    Review.aggregate.mockResolvedValue([{ avgRating: 4.5, totalReviews: 2 }]);

    const result = await reviewService.getReviewsByProduct('product-1', 1, 5, 'all');

    expect(Review.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ $match: { productId: 'product-1', isApproved: true } }),
    ]));
    expect(result.pagination).toEqual({
      totalReviews: 1,
      currentPage: 1,
      totalPages: 1,
      limit: 5,
      ratingSummary: { avg: 4.5, count: 2 },
    });
    expect(result.reviews).toEqual([{ _id: 'review-1', rating: 5, likes: 1 }]);
  });

  it('casts product id before aggregating the rating summary', async () => {
    const productId = new mongoose.Types.ObjectId().toString();
    Review.find.mockReturnValue(createQueryMock([]));
    Review.countDocuments.mockResolvedValue(0);
    Review.aggregate.mockResolvedValue([]);

    await reviewService.getReviewsByProduct(productId, 1, 5, 'all');

    expect(Review.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          isApproved: true,
        },
      }),
    ]));
  });

  it('returns paginated reviews for admin moderation', async () => {
    Review.find.mockReturnValue(createQueryMock([{ _id: 'review-2', rating: 4, likes: 2 }]));
    Review.countDocuments.mockResolvedValue(1);

    const result = await reviewService.getAllReviews({ page: 2, limit: 10, ratingFilter: 4 });

    expect(Review.find).toHaveBeenCalledWith({ rating: 4 });
    expect(result.pagination).toEqual({ totalReviews: 1, currentPage: 2, totalPages: 1, limit: 10 });
    expect(result.reviews).toEqual([{ _id: 'review-2', rating: 4, likes: 2 }]);
  });

  it('updates the review and refreshes product stats when rating changes', async () => {
    const session = createSessionMock();
    const reviewDoc = {
      _id: 'review-1',
      userId: { toString: () => 'user-1' },
      productId: 'product-1',
      rating: 4,
      title: 'Old',
      comment: 'Old comment',
      images: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    mongoose.startSession.mockResolvedValue(session);
    Review.findById.mockReturnValue(createQueryMock(reviewDoc));

    const result = await reviewService.updateReview('review-1', 'user-1', {
      rating: 5,
      title: 'Updated',
      comment: 'Updated comment',
    });

    expect(reviewDoc.save).toHaveBeenCalledWith({ session });
    expect(productService.updateRatingStats).toHaveBeenCalledWith('product-1', session);
    expect(result).toEqual({ _id: 'review-1', rating: 5, likes: 0 });
  });

  it('prevents non-admin users from deleting someone else\'s review', async () => {
    Review.findById.mockReturnValue(createQueryMock({
      userId: { toString: () => 'owner-user' },
      productId: 'product-1',
    }));

    await expect(reviewService.deleteReview('review-1', 'other-user', false)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('allows admins to delete reviews and refresh rating stats', async () => {
    const session = createSessionMock();
    mongoose.startSession.mockResolvedValue(session);
    Review.findById.mockReturnValue(createQueryMock({
      _id: 'review-1',
      userId: { toString: () => 'user-1' },
      productId: 'product-1',
    }));
    Review.findByIdAndDelete.mockReturnValue(createQueryMock({ _id: 'review-1' }));

    const result = await reviewService.deleteReview('review-1', 'admin-id', true);

    expect(Review.findByIdAndDelete).toHaveBeenCalledWith('review-1');
    expect(productService.updateRatingStats).toHaveBeenCalledWith('product-1', session);
    expect(result).toEqual({ message: 'Đã xóa đánh giá thành công.' });
  });

  it('likes a review when the user has not liked it yet', async () => {
    Review.findOneAndUpdate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ likes: 3 });

    const result = await reviewService.likeReview('review-1', 'user-1');

    expect(result).toEqual({ message: 'Đã thích đánh giá', likes: 3 });
  });

  it('unlikes a review when the user already liked it', async () => {
    Review.findOneAndUpdate.mockResolvedValueOnce({ likes: 0 });

    const result = await reviewService.likeReview('review-1', 'user-1');

    expect(result).toEqual({ message: 'Đã bỏ thích đánh giá', likes: 0 });
  });
});
