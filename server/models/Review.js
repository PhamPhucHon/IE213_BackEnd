const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true }, // snapshot
  userAvatar: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: { type: String, required: true },
  images: [String],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  replies: [{
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: String,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// 1. INDEXES
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); 
reviewSchema.index({ productId: 1, rating: -1, createdAt: -1 }); 
reviewSchema.index({ productId: 1 });

// 2. MIDDLEWARES
// Tự động đánh dấu là verified purchase nếu user đã mua sản phẩm này
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Order = mongoose.model('Order');
    const hasPurchased = await Order.exists({ 
      userId: this.userId, 
      'items.productId': this.productId,
      status: { $in: ['Shipped', 'Delivered'] }
    });
    this.isVerifiedPurchase = !!hasPurchased;
  }
  next();
});

// Tính toán lại điểm rating trung bình và số lượng review mỗi khi có review mới hoặc review bị xóa
// Dùng 'post' thay vì 'pre' vì ta cần review đã nằm trong DB thì Aggregation mới tính đúng được
reviewSchema.post('save', async function() {
  // 'this' ở đây là document review vừa được lưu
  await this.constructor.calculateAverageRating(this.productId);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  // 'doc' chính là review vừa bị xóa
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.productId);
  }
});
 
// 3. STATIC METHODS
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { productId: productId }
    },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    const Product = mongoose.model('Product');

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        $set: {
          'rating.avg': Math.round(stats[0].avgRating * 10) / 10,
          'rating.count': stats[0].totalReviews
        }
      });
    } else {
      // Reset khi không còn review
      await Product.findByIdAndUpdate(productId, {
        $set: {
          'rating.avg': 0,
          'rating.count': 0
        }
      });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật rating cho Product:', error);
  }
};

module.exports = mongoose.model('Review', reviewSchema);