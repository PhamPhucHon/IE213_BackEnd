const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
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
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, isApproved: 1, rating: -1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);