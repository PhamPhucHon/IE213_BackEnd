const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true }, // khóa chính
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: { type: Number, required: true, default: 0 }, // tồn kho thực
  reserved: { type: Number, default: 0 }, // tồn kho đã đặt nhưng chưa thanh toán
  warehouse: { type: String, default: 'main' },
  lastRestocked: Date,
});

// 1. INDEXES
inventorySchema.index({ productId: 1 });

// 2. MIDDLEWARES (Hooks)
// Trước khi lưu, đảm bảo rằng reserved không vượt quá stock
inventorySchema.pre('save', function() {
  if (this.reserved > this.stock) {
    throw new Error(`Lỗi kho: SKU ${this.sku} có lượng giữ chỗ (reserved) vượt quá tồn kho (stock) hiện tại.`);
  }
});

// 3. INSTANCE METHODS
// Tính số lượng hàng còn lại có thể bán (hiển thị cho khách)
inventorySchema.methods.getAvailable = function() {
  return this.stock - this.reserved;
};

// Nhập thêm hàng vào kho
inventorySchema.methods.addStock = async function(quantity) {
  if (quantity <= 0) throw new Error('Số lượng nhập kho phải lớn hơn 0');
  
  this.stock += quantity;
  this.lastRestocked = Date.now();
  return await this.save();
};

// Giữ chỗ sản phẩm (Dùng khi khách bấm "Đặt hàng" - Trạng thái Pending)
inventorySchema.methods.reserveStock = async function(quantity) {
  if (this.getAvailable() < quantity) {
    throw new Error(`Mã ${this.sku} không đủ số lượng tồn kho. (Còn: ${this.getAvailable()})`);
  }
  
  this.reserved += quantity;
  return await this.save();
};

// Nhả chỗ sản phẩm (Dùng khi Hủy đơn hàng hoặc hết hạn thanh toán)
inventorySchema.methods.releaseStock = async function(quantity) {
  if (this.reserved < quantity) {
    throw new Error(`Lỗi: Số lượng nhả kho (${quantity}) lớn hơn số lượng đang giữ (${this.reserved})`);
  }
  
  this.reserved -= quantity;
  return await this.save();
};

// Xuất kho thực tế (Dùng khi đơn hàng chuyển sang trạng thái "Đã thanh toán" hoặc "Đã giao")
inventorySchema.methods.issueStock = async function(quantity) {
  if (this.reserved < quantity) {
    throw new Error(`Lỗi xuất kho: Chưa có đủ số lượng đặt trước cho SKU ${this.sku}`);
  }
  // Trừ đi ở cả 2 nơi (vì hàng giữ chỗ nay đã thực sự biến mất khỏi kho)
  this.stock -= quantity;
  this.reserved -= quantity;
  return await this.save();
};

module.exports = mongoose.model('Inventory', inventorySchema);