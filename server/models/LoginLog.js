const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email: { type: String, required: true }, // lưu email đã dùng đăng nhập
  status: { type: String, enum: ['success', 'failed'], required: true },
  ipAddress: { type: String },
  userAgent: { type: String }, // trình duyệt, thiết bị
  failureReason: { type: String }, // ví dụ: 'wrong password', 'account locked'
  createdAt: { type: Date, default: Date.now, index: true }
});

// 1. INDEXES
loginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
loginLogSchema.index({ userId: 1, createdAt: -1 });
loginLogSchema.index({ email: 1, status: 1, createdAt: -1 });

// 2. STATIC METHODS
// Hàm lưu log nhanh gọn
loginLogSchema.statics.recordLog = async function(logData) {
  try {
    await this.create(logData);
  } catch (error) {
    console.error('Lỗi khi ghi LoginLog:', error);
    // Bỏ qua lỗi để không làm sập luồng đăng nhập chính của người dùng
  }
};

// Kiểm tra tấn công dò mật khẩu (Brute-Force)
// Trả về true nếu email này đăng nhập sai quá {limit} lần trong {minutes} phút qua
loginLogSchema.statics.isBruteForceAttack = async function(email, limit = 5, minutes = 15) {
  const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
  
  const failedAttempts = await this.countDocuments({
    email: email,
    status: 'Failed',
    createdAt: { $gte: timeThreshold } // Lọc các log thất bại từ 15 phút trước đến nay
  });

  return failedAttempts >= limit;
};
module.exports = mongoose.model('LoginLog', loginLogSchema);