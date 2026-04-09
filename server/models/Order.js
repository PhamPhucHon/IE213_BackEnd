const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: String,
  name: String,
  image: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String
  },
  paymentMethod: { type: String, required: true, enum: ['COD', 'Momo', 'BankTransfer'] },
  paymentResult: {
    id: String,
    status: String,
    updateTime: Date
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  deliveredAt: Date,
  note: String
}, { timestamps: true });

// 1. INDEXES
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// 2. MIDDLEWARES 
// Tự động tạo orderNumber trước khi validate nếu chưa có
orderSchema.pre('save', function() {
  if (this.isNew && !this.orderNumber) {
    // Sinh mã theo định dạng: ORD-YYYYMMDD-RandomString
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, ''); // VD: 20260403
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${dateString}-${randomCode}`;
  }
});

// 3. INSTANCE METHODS
// Đánh dấu thanh toán thành công
orderSchema.methods.markAsPaid = async function() {
  if (this.isPaid) {
    throw new Error('Đơn hàng này đã được thanh toán rồi.');
  }

  this.isPaid = true;
  this.paidAt = Date.now();

  // Nếu là đơn đang chờ xử lý thì chuyển sang đang xử lý
  if (this.status === 'Pending') {
    this.status = 'Processing';
  }

  return await this.save();
};

// Đánh dấu giao hàng thành công & XUẤT KHO THẬT
orderSchema.methods.markAsDelivered = async function() {
  if (this.status === 'Delivered') {
    throw new Error('Đơn hàng đã ở trạng thái Đã Giao.');
  }

  if (this.status === 'Cancelled') {
    throw new Error('Không thể giao một đơn hàng đã bị hủy.');
  }

  const Inventory = mongoose.model('Inventory');

  for (const item of this.items) {
    const inventory = await Inventory.findOne({ sku: item.sku });
    if (inventory) {
      await inventory.issueStock(item.quantity);
    }
  }

  this.status = 'Delivered';
  this.deliveredAt = Date.now();

  if (this.paymentMethod === 'COD' && !this.isPaid) {
    this.isPaid = true;
    this.paidAt = Date.now();
  }

  return await this.save();
};

// Hủy đơn hàng & NHẢ KHO
orderSchema.methods.cancelOrder = async function(reason) {
  if (this.status === 'Delivered') {
    throw new Error('Không thể hủy đơn hàng đã giao thành công.');
  }

  if (this.status === 'Cancelled') {
    throw new Error('Đơn hàng này đã bị hủy trước đó.');
  }

  const Inventory = mongoose.model('Inventory');

  for (const item of this.items) {
    const inventory = await Inventory.findOne({ sku: item.sku });
    if (inventory) {
      await inventory.releaseStock(item.quantity);
    }
  }

  this.status = 'Cancelled';

  this.note = reason || 'Hủy theo yêu cầu';

  return await this.save();
};

// 4. STATIC METHODS
// Lấy đơn hàng theo userId với phân trang
orderSchema.statics.getOrdersByUser = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const orders = await this.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const totalOrders = await this.countDocuments({ userId });
  
  return {
    orders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page
  };
};

module.exports = mongoose.model('Order', orderSchema);