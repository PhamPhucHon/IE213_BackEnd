const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/hashPassword');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  phone: { type: String },
  isAdmin: { type: Boolean, default: false },
  addresses: [
    {
      label: { type: String, default: 'Home' },
      address: String,
      isDefault: { type: Boolean, default: false },
    }
  ],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ createdAt: -1 });

// 1. Middleware: 
// Pre-save hook để tự động băm mật khẩu trước khi lưu vào database
userSchema.pre('save', async function() {
  // Chỉ băm lại nếu mật khẩu bị thay đổi (tạo mới hoặc update)
  if (!this.isModified('password')) {
    return;
  }

  this.password = await hashPassword(this.password);
});

// Hook tùy chọn: Nếu User bị đổi trạng thái thành isActive = false 
userSchema.pre('save', async function() {
  // Kiểm tra nếu trường isActive vừa bị thay đổi thành false
  if (this.isModified('isActive') && this.isActive === false) {
    const Cart = mongoose.model('Cart');
    // Dọn dẹp giỏ hàng của user này
    await Cart.deleteOne({ userId: this._id });
  }
});

// Tự động ẩn các User bị khóa (isActive: false) khi tìm kiếm,
// ngoại trừ các query chủ động bật option includeInactive (dùng cho Admin).
userSchema.pre(/^find/, function() {
  const opts = this.getOptions ? this.getOptions() : {};
  if (opts.includeInactive) {
    return;
  }

  this.find({ isActive: { $ne: false } });
});


// 2. Instance Method: 
// Phương thức để so sánh mật khẩu khi đăng nhập
userSchema.methods.matchPassword = async function(enteredPassword) {
  // Dùng tiện ích comparePassword
  return await comparePassword(enteredPassword, this.password);
};

// Phương thức Xóa mềm 
userSchema.methods.softDelete = async function() {
  this.isActive = false;
  return await this.save(); // Khi save() chạy, nó sẽ kích hoạt cái hook dọn giỏ hàng
};

// Tự động ẩn thông tin nhạy cảm khi trả dữ liệu về Frontend
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);