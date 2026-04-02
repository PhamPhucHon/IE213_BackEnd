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

module.exports = mongoose.model('LoginLog', loginLogSchema);